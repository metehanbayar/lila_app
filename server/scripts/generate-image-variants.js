import fs from 'fs/promises';
import path from 'path';
import { ensureImageVariants, getAllUploadOriginalFiles, isVariantFileName, uploadsDir } from '../utils/image-variants.js';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }

      return fullPath;
    }),
  );

  return files.flat();
}

async function main() {
  const startedAt = Date.now();
  const existingFiles = await walk(uploadsDir);
  const originalFiles = getAllUploadOriginalFiles(
    existingFiles.filter((filePath) => {
      const extension = path.extname(filePath).toLowerCase();
      return SUPPORTED_EXTENSIONS.has(extension) && !isVariantFileName(path.basename(filePath));
    }),
  );

  let processed = 0;
  let failed = 0;

  for (const filePath of originalFiles) {
    try {
      await ensureImageVariants(filePath);
      processed += 1;
    } catch (error) {
      failed += 1;
      console.error(`Variant olusturulamadi: ${filePath}`);
      console.error(error.message);
    }
  }

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Toplam dosya: ${originalFiles.length}`);
  console.log(`Basarili: ${processed}`);
  console.log(`Hatali: ${failed}`);
  console.log(`Sure: ${elapsedSeconds}s`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Variant backfill hatasi:', error);
  process.exit(1);
});
