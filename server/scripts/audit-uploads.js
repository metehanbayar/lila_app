import crypto from 'crypto';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { closeConnection, getConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadsDir = path.resolve(__dirname, '../uploads');

export function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getCliOption(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

export function parseUploadReference(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const normalizedValue = trimmed.replace(/\\/g, '/');
  const uploadsIndex = normalizedValue.toLowerCase().indexOf('/uploads/');

  if (uploadsIndex !== -1) {
    const relativePath = normalizedValue.slice(uploadsIndex + '/uploads/'.length);
    return {
      rawValue: trimmed,
      relativePath,
      normalizedUrl: `/uploads/${relativePath}`,
      basename: path.posix.basename(relativePath),
    };
  }

  const uploadsDirNormalized = uploadsDir.replace(/\\/g, '/').toLowerCase();
  if (normalizedValue.toLowerCase().startsWith(uploadsDirNormalized)) {
    const relativePath = path.relative(uploadsDir, trimmed).replace(/\\/g, '/');
    return {
      rawValue: trimmed,
      relativePath,
      normalizedUrl: `/uploads/${relativePath}`,
      basename: path.posix.basename(relativePath),
    };
  }

  if (!normalizedValue.includes('/')) {
    return {
      rawValue: trimmed,
      relativePath: normalizedValue,
      normalizedUrl: `/uploads/${normalizedValue}`,
      basename: normalizedValue,
    };
  }

  return null;
}

export async function listFilesRecursively(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(absolutePath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stats = await fsp.stat(absolutePath);
    const relativePath = path.relative(uploadsDir, absolutePath).replace(/\\/g, '/');
    files.push({
      absolutePath,
      relativePath,
      normalizedUrl: `/uploads/${relativePath}`,
      basename: path.posix.basename(relativePath),
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    });
  }

  return files;
}

export async function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');

  return await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function getSchema(pool) {
  const result = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN ('Media', 'Products', 'Restaurants')
  `);

  return result.recordset.reduce((acc, row) => {
    if (!acc[row.TABLE_NAME]) {
      acc[row.TABLE_NAME] = new Set();
    }

    acc[row.TABLE_NAME].add(row.COLUMN_NAME);
    return acc;
  }, {});
}

function hasColumns(schema, tableName, columns) {
  const tableColumns = schema[tableName];
  return Boolean(tableColumns && columns.every(column => tableColumns.has(column)));
}

export async function loadReferences(pool, schema) {
  const references = [];

  if (hasColumns(schema, 'Media', ['Id', 'FileName', 'FilePath', 'FileUrl'])) {
    const mediaResult = await pool.request().query(`
      SELECT Id, FileName, FilePath, FileUrl
      FROM Media
    `);

    for (const row of mediaResult.recordset) {
      const candidates = [
        { rawValue: row.FileUrl, sourceField: 'Media.FileUrl' },
        { rawValue: row.FilePath, sourceField: 'Media.FilePath' },
        { rawValue: row.FileName, sourceField: 'Media.FileName' },
      ];

      for (const candidate of candidates) {
        const parsed = parseUploadReference(candidate.rawValue);
        if (!parsed) {
          continue;
        }

        references.push({
          table: 'Media',
          recordId: row.Id,
          sourceField: candidate.sourceField,
          ...parsed,
        });
      }
    }
  }

  if (hasColumns(schema, 'Products', ['Id', 'Name', 'ImageUrl'])) {
    const productResult = await pool.request().query(`
      SELECT Id, Name, ImageUrl
      FROM Products
      WHERE ImageUrl IS NOT NULL AND LTRIM(RTRIM(ImageUrl)) <> ''
    `);

    for (const row of productResult.recordset) {
      const parsed = parseUploadReference(row.ImageUrl);
      if (!parsed) {
        continue;
      }

      references.push({
        table: 'Products',
        recordId: row.Id,
        label: row.Name,
        sourceField: 'Products.ImageUrl',
        ...parsed,
      });
    }
  }

  if (hasColumns(schema, 'Restaurants', ['Id', 'Name', 'ImageUrl'])) {
    const restaurantImageResult = await pool.request().query(`
      SELECT Id, Name, ImageUrl
      FROM Restaurants
      WHERE ImageUrl IS NOT NULL AND LTRIM(RTRIM(ImageUrl)) <> ''
    `);

    for (const row of restaurantImageResult.recordset) {
      const parsed = parseUploadReference(row.ImageUrl);
      if (!parsed) {
        continue;
      }

      references.push({
        table: 'Restaurants',
        recordId: row.Id,
        label: row.Name,
        sourceField: 'Restaurants.ImageUrl',
        ...parsed,
      });
    }
  }

  if (hasColumns(schema, 'Restaurants', ['Id', 'Name', 'ReceiptTemplate'])) {
    const templateResult = await pool.request().query(`
      SELECT Id, Name, ReceiptTemplate
      FROM Restaurants
      WHERE ReceiptTemplate IS NOT NULL AND LTRIM(RTRIM(ReceiptTemplate)) <> ''
    `);

    for (const row of templateResult.recordset) {
      try {
        const template = JSON.parse(row.ReceiptTemplate);
        const parsed = parseUploadReference(template?.logoUrl);
        if (!parsed) {
          continue;
        }

        references.push({
          table: 'Restaurants',
          recordId: row.Id,
          label: row.Name,
          sourceField: 'Restaurants.ReceiptTemplate.logoUrl',
          ...parsed,
        });
      } catch (error) {
        references.push({
          table: 'Restaurants',
          recordId: row.Id,
          label: row.Name,
          sourceField: 'Restaurants.ReceiptTemplate',
          parseError: error.message,
          rawValue: row.ReceiptTemplate,
        });
      }
    }
  }

  return references;
}

export async function buildDuplicateReport(files, referenceCountByPath = new Map()) {
  const sizeGroups = new Map();

  for (const file of files) {
    const key = String(file.size);
    if (!sizeGroups.has(key)) {
      sizeGroups.set(key, []);
    }
    sizeGroups.get(key).push(file);
  }

  const duplicateGroups = [];

  for (const group of sizeGroups.values()) {
    if (group.length < 2) {
      continue;
    }

    const hashGroups = new Map();
    for (const file of group) {
      const hash = await computeSha256(file.absolutePath);
      file.sha256 = hash;

      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash).push(file);
    }

    for (const [hash, hashedFiles] of hashGroups.entries()) {
      if (hashedFiles.length < 2) {
        continue;
      }

      duplicateGroups.push({
        sha256: hash,
        size: hashedFiles[0].size,
        reclaimableBytes: hashedFiles[0].size * (hashedFiles.length - 1),
        files: hashedFiles.map(file => ({
          relativePath: file.relativePath,
          size: file.size,
          modifiedAt: file.modifiedAt,
          referenceCount: referenceCountByPath.get(file.relativePath) ?? 0,
        })),
      });
    }
  }

  duplicateGroups.sort((left, right) => right.reclaimableBytes - left.reclaimableBytes);

  return duplicateGroups;
}

export function buildPathIndex(files) {
  const byRelativePath = new Map();
  const byBasename = new Map();

  for (const file of files) {
    byRelativePath.set(file.relativePath, file);

    if (!byBasename.has(file.basename)) {
      byBasename.set(file.basename, []);
    }
    byBasename.get(file.basename).push(file);
  }

  return { byRelativePath, byBasename };
}

export async function runAudit({ jsonOutputPath } = {}) {
  const files = await listFilesRecursively(uploadsDir);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const pathIndex = buildPathIndex(files);

  const pool = await getConnection();
  const schema = await getSchema(pool);
  const references = await loadReferences(pool, schema);

  const matchedPaths = new Set();
  const missingReferences = [];
  const matchedReferences = [];
  const parseErrors = references.filter(reference => reference.parseError);

  for (const reference of references) {
    if (reference.parseError) {
      continue;
    }

    const exactFile = pathIndex.byRelativePath.get(reference.relativePath);
    if (exactFile) {
      matchedPaths.add(exactFile.relativePath);
      matchedReferences.push({
        ...reference,
        matchedPath: exactFile.relativePath,
        matchedBy: 'exact',
      });
      continue;
    }

    const basenameMatches = pathIndex.byBasename.get(reference.basename) ?? [];
    if (basenameMatches.length === 1) {
      matchedPaths.add(basenameMatches[0].relativePath);
      matchedReferences.push({
        ...reference,
        matchedPath: basenameMatches[0].relativePath,
        matchedBy: 'basename',
      });
      continue;
    }

    missingReferences.push({
      ...reference,
      reason: basenameMatches.length > 1 ? 'ambiguous-basename' : 'missing-on-disk',
    });
  }

  const orphanFiles = files
    .filter(file => !matchedPaths.has(file.relativePath))
    .sort((left, right) => right.size - left.size);

  const referenceCountByPath = matchedReferences.reduce((acc, reference) => {
    acc.set(reference.matchedPath, (acc.get(reference.matchedPath) ?? 0) + 1);
    return acc;
  }, new Map());

  const duplicateGroups = await buildDuplicateReport(files, referenceCountByPath);
  const duplicateFileCount = duplicateGroups.reduce((sum, group) => sum + group.files.length, 0);
  const duplicateExtraFiles = duplicateGroups.reduce((sum, group) => sum + group.files.length - 1, 0);
  const reclaimableBytes = duplicateGroups.reduce((sum, group) => sum + group.reclaimableBytes, 0);
  const orphanBytes = orphanFiles.reduce((sum, file) => sum + file.size, 0);

  const report = {
    scannedAt: new Date().toISOString(),
    uploadsDir,
    summary: {
      totalFiles: files.length,
      totalBytes,
      totalSize: formatBytes(totalBytes),
      totalReferences: references.length,
      matchedReferences: matchedReferences.length,
      missingReferences: missingReferences.length,
      parseErrors: parseErrors.length,
      orphanFiles: orphanFiles.length,
      orphanBytes,
      orphanSize: formatBytes(orphanBytes),
      duplicateGroups: duplicateGroups.length,
      duplicateFiles: duplicateFileCount,
      duplicateExtraFiles,
      reclaimableBytes,
      reclaimableSize: formatBytes(reclaimableBytes),
    },
    matchedReferences,
    missingReferences,
    parseErrors,
    orphanFiles: orphanFiles.map(file => ({
      relativePath: file.relativePath,
      size: file.size,
      sizeLabel: formatBytes(file.size),
      modifiedAt: file.modifiedAt,
    })),
    duplicateGroups,
  };

  if (jsonOutputPath) {
    const absoluteOutputPath = path.resolve(process.cwd(), jsonOutputPath);
    await fsp.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await fsp.writeFile(absoluteOutputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`JSON report written: ${absoluteOutputPath}`);
  }

  return report;
}

async function main() {
  try {
    const jsonOutputPath = getCliOption('--json');
    const report = await runAudit({ jsonOutputPath });

    console.log(`Uploads scanned: ${report.summary.totalFiles} files (${report.summary.totalSize})`);
    console.log(`DB references: ${report.summary.totalReferences}`);
    console.log(`Missing references: ${report.summary.missingReferences}`);
    console.log(`Receipt template parse errors: ${report.summary.parseErrors}`);
    console.log(`Orphan files: ${report.summary.orphanFiles} (${report.summary.orphanSize})`);
    console.log(`Duplicate groups: ${report.summary.duplicateGroups}`);
    console.log(`Duplicate extra files: ${report.summary.duplicateExtraFiles} (${report.summary.reclaimableSize} reclaimable)`);

    if (report.missingReferences.length > 0) {
      console.log('\nTop missing references:');
      for (const item of report.missingReferences.slice(0, 10)) {
        console.log(`- ${item.sourceField} [${item.table}#${item.recordId}] -> ${item.rawValue} (${item.reason})`);
      }
    }

    if (report.orphanFiles.length > 0) {
      console.log('\nTop orphan files:');
      for (const item of report.orphanFiles.slice(0, 10)) {
        console.log(`- ${item.relativePath} (${item.sizeLabel})`);
      }
    }

    if (report.duplicateGroups.length > 0) {
      console.log('\nTop duplicate groups:');
      for (const group of report.duplicateGroups.slice(0, 5)) {
        console.log(`- ${group.files.length} files, ${formatBytes(group.size)} each, ${formatBytes(group.reclaimableBytes)} reclaimable`);
        for (const file of group.files.slice(0, 5)) {
          console.log(`  * ${file.relativePath} (${file.referenceCount} refs)`);
        }
      }
    }
  } finally {
    await closeConnection();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch(error => {
    console.error('Upload audit failed.');
    console.error(error.message);
    process.exitCode = 1;
  });
}
