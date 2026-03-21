import fs from 'fs';
import path from 'path';
import { closeConnection, getConnection, sql } from '../config/database.js';
import { formatBytes, parseUploadReference, runAudit, uploadsDir } from './audit-uploads.js';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function chooseCanonicalFile(files) {
  return [...files].sort((left, right) => {
    if (right.referenceCount !== left.referenceCount) {
      return right.referenceCount - left.referenceCount;
    }

    return left.relativePath.localeCompare(right.relativePath);
  })[0];
}

function buildAbsolutePath(relativePath) {
  return path.join(uploadsDir, relativePath);
}

async function updateReceiptTemplates(transaction, duplicateUrl, duplicateBasename, canonicalUrl) {
  const candidates = await transaction
    .request()
    .input('urlLike', sql.NVarChar, `%${duplicateUrl}%`)
    .input('basenameLike', sql.NVarChar, `%${duplicateBasename}%`)
    .query(`
      SELECT Id, ReceiptTemplate
      FROM Restaurants
      WHERE ReceiptTemplate LIKE @urlLike OR ReceiptTemplate LIKE @basenameLike
    `);

  let updatedRows = 0;

  for (const row of candidates.recordset) {
    try {
      const template = JSON.parse(row.ReceiptTemplate);
      const parsedLogo = parseUploadReference(template?.logoUrl);
      if (!parsedLogo) {
        continue;
      }

      if (parsedLogo.normalizedUrl !== duplicateUrl && parsedLogo.basename !== duplicateBasename) {
        continue;
      }

      template.logoUrl = canonicalUrl;

      await transaction
        .request()
        .input('id', sql.Int, row.Id)
        .input('template', sql.NVarChar, JSON.stringify(template))
        .query(`
          UPDATE Restaurants
          SET ReceiptTemplate = @template, UpdatedAt = GETDATE()
          WHERE Id = @id
        `);

      updatedRows += 1;
    } catch (error) {
      throw new Error(`ReceiptTemplate parse/update failed for restaurant ${row.Id}: ${error.message}`);
    }
  }

  return updatedRows;
}

async function consolidateDuplicateGroup(transaction, group) {
  const canonical = chooseCanonicalFile(group.files);
  const redundantFiles = group.files.filter(file => file.relativePath !== canonical.relativePath);
  const canonicalUrl = `/uploads/${canonical.relativePath}`;
  const canonicalBasename = path.posix.basename(canonical.relativePath);
  const canonicalAbsolutePath = buildAbsolutePath(canonical.relativePath);

  const groupStats = {
    canonical: canonical.relativePath,
    deletedFiles: [],
    productsUpdated: 0,
    restaurantsUpdated: 0,
    receiptTemplatesUpdated: 0,
    mediaRowsUpdated: 0,
  };

  for (const file of redundantFiles) {
    const duplicateUrl = `/uploads/${file.relativePath}`;
    const duplicateBasename = path.posix.basename(file.relativePath);
    const duplicateAbsolutePath = buildAbsolutePath(file.relativePath);

    const productResult = await transaction
      .request()
      .input('canonicalUrl', sql.NVarChar, canonicalUrl)
      .input('duplicateUrl', sql.NVarChar, duplicateUrl)
      .input('duplicateBasename', sql.NVarChar, duplicateBasename)
      .query(`
        UPDATE Products
        SET ImageUrl = @canonicalUrl, UpdatedAt = GETDATE()
        WHERE ImageUrl = @duplicateUrl OR ImageUrl = @duplicateBasename
      `);

    const restaurantResult = await transaction
      .request()
      .input('canonicalUrl', sql.NVarChar, canonicalUrl)
      .input('duplicateUrl', sql.NVarChar, duplicateUrl)
      .input('duplicateBasename', sql.NVarChar, duplicateBasename)
      .query(`
        UPDATE Restaurants
        SET ImageUrl = @canonicalUrl, UpdatedAt = GETDATE()
        WHERE ImageUrl = @duplicateUrl OR ImageUrl = @duplicateBasename
      `);

    const mediaResult = await transaction
      .request()
      .input('canonicalFileName', sql.NVarChar, canonicalBasename)
      .input('canonicalFilePath', sql.NVarChar, canonicalAbsolutePath)
      .input('canonicalFileUrl', sql.NVarChar, canonicalUrl)
      .input('duplicateFileName', sql.NVarChar, duplicateBasename)
      .input('duplicateFilePath', sql.NVarChar, duplicateAbsolutePath)
      .input('duplicateFileUrl', sql.NVarChar, duplicateUrl)
      .query(`
        UPDATE Media
        SET FileName = @canonicalFileName,
            FilePath = @canonicalFilePath,
            FileUrl = @canonicalFileUrl
        WHERE FileUrl = @duplicateFileUrl
           OR FilePath = @duplicateFilePath
           OR FileName = @duplicateFileName
      `);

    const receiptTemplatesUpdated = await updateReceiptTemplates(
      transaction,
      duplicateUrl,
      duplicateBasename,
      canonicalUrl,
    );

    groupStats.productsUpdated += productResult.rowsAffected[0] ?? 0;
    groupStats.restaurantsUpdated += restaurantResult.rowsAffected[0] ?? 0;
    groupStats.mediaRowsUpdated += mediaResult.rowsAffected[0] ?? 0;
    groupStats.receiptTemplatesUpdated += receiptTemplatesUpdated;
    groupStats.deletedFiles.push(file.relativePath);
  }

  return groupStats;
}

async function main() {
  try {
    const applyChanges = hasFlag('--apply');
    const initialReport = await runAudit();

    if (initialReport.summary.duplicateGroups === 0) {
      console.log('No duplicate upload groups found.');
      return;
    }

    console.log(`Duplicate groups found: ${initialReport.summary.duplicateGroups}`);
    console.log(`Potential reclaimable size: ${initialReport.summary.reclaimableSize}`);

    for (const group of initialReport.duplicateGroups.slice(0, 5)) {
      const canonical = chooseCanonicalFile(group.files);
      const redundantFiles = group.files.filter(file => file.relativePath !== canonical.relativePath);
      console.log(`- Canonical: ${canonical.relativePath} (${canonical.referenceCount} refs)`);
      for (const file of redundantFiles.slice(0, 5)) {
        console.log(`  * remove ${file.relativePath} (${file.referenceCount} refs)`);
      }
    }

    if (!applyChanges) {
      console.log('\nDry run only. Re-run with --apply to consolidate duplicates.');
      return;
    }

    const pool = await getConnection();
    const transaction = pool.transaction();
    const deletedFiles = [];

    await transaction.begin();

    for (const group of initialReport.duplicateGroups) {
      const result = await consolidateDuplicateGroup(transaction, group);
      deletedFiles.push(...result.deletedFiles);
    }

    await transaction.commit();

    for (const relativePath of deletedFiles) {
      const absolutePath = buildAbsolutePath(relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    const finalReport = await runAudit();

    console.log('\nDuplicate cleanup applied.');
    console.log(`Remaining duplicate groups: ${finalReport.summary.duplicateGroups}`);
    console.log(`Remaining duplicate extra files: ${finalReport.summary.duplicateExtraFiles}`);
    console.log(`Remaining reclaimable size: ${finalReport.summary.reclaimableSize}`);
  } finally {
    await closeConnection();
  }
}

main().catch(error => {
  console.error('Duplicate cleanup failed.');
  console.error(error.message);
  process.exitCode = 1;
});
