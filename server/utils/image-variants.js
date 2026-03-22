import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = path.resolve(__dirname, '../uploads');

export const IMAGE_VARIANTS = {
  thumb: { width: 320, quality: 72 },
  medium: { width: 720, quality: 78 },
  large: { width: 1280, quality: 84 },
};

const VARIANT_PATTERN = /__(thumb|medium|large)$/i;
const VARIANT_FILE_PATTERN = /__(thumb|medium|large)\.webp$/i;
const UPLOADS_PREFIX = '/uploads/';

function stripQueryAndHash(value) {
  return String(value || '').split('#')[0].split('?')[0];
}

function isDataUrl(value) {
  return stripQueryAndHash(value).startsWith('data:');
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function getBaseName(name) {
  return name.replace(VARIANT_PATTERN, '');
}

export function isLocalUploadUrl(value) {
  return stripQueryAndHash(value).startsWith(UPLOADS_PREFIX);
}

export function isVariantFileName(value) {
  return VARIANT_FILE_PATTERN.test(String(value || ''));
}

export function buildVariantUrlMap(fileUrl) {
  if (!isLocalUploadUrl(fileUrl)) {
    return null;
  }

  const normalizedUrl = stripQueryAndHash(fileUrl);
  const relativePath = normalizedUrl.slice(UPLOADS_PREFIX.length).replace(/^\/+/, '');
  const parsed = path.posix.parse(relativePath);
  const baseName = getBaseName(parsed.name);
  const relativeDir = parsed.dir ? `${parsed.dir}/` : '';
  const original = `${UPLOADS_PREFIX}${relativeDir}${baseName}${parsed.ext}`;

  return {
    original,
    thumb: `${UPLOADS_PREFIX}${relativeDir}${baseName}__thumb.webp`,
    medium: `${UPLOADS_PREFIX}${relativeDir}${baseName}__medium.webp`,
    large: `${UPLOADS_PREFIX}${relativeDir}${baseName}__large.webp`,
  };
}

export function resolveUploadPathFromUrl(fileUrl) {
  if (!isLocalUploadUrl(fileUrl)) {
    return null;
  }

  const normalizedUrl = stripQueryAndHash(fileUrl);
  const relativePath = decodeURIComponent(normalizedUrl.slice(UPLOADS_PREFIX.length).replace(/^\/+/, ''));
  const segments = relativePath.split('/').filter(Boolean);

  return path.join(uploadsDir, ...segments);
}

export function buildVariantPathMap(filePath) {
  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(filePath);
  const relativePath = path.relative(uploadsDir, absolutePath);

  if (relativePath.startsWith('..')) {
    return null;
  }

  const parsed = path.parse(absolutePath);
  const baseName = getBaseName(parsed.name);

  return {
    original: absolutePath,
    thumb: path.join(parsed.dir, `${baseName}__thumb.webp`),
    medium: path.join(parsed.dir, `${baseName}__medium.webp`),
    large: path.join(parsed.dir, `${baseName}__large.webp`),
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureImageVariants(filePath) {
  if (!filePath || isVariantFileName(path.basename(filePath))) {
    return null;
  }

  const variantPaths = buildVariantPathMap(filePath);
  if (!variantPaths) {
    return null;
  }

  const metadata = await sharp(filePath, { animated: true, failOn: 'none' }).rotate().metadata();

  await Promise.all(
    Object.entries(IMAGE_VARIANTS).map(async ([variantKey, variantConfig]) => {
      const outputPath = variantPaths[variantKey];
      if (await fileExists(outputPath)) {
        return;
      }

      await sharp(filePath, { animated: true, failOn: 'none' })
        .rotate()
        .resize({
          width: variantConfig.width,
          withoutEnlargement: true,
        })
        .webp({
          quality: variantConfig.quality,
          effort: 4,
        })
        .toFile(outputPath);
    }),
  );

  return metadata;
}

export async function removeImageVariants(filePath) {
  const variantPaths = buildVariantPathMap(filePath);
  if (!variantPaths) {
    return;
  }

  await Promise.all(
    ['thumb', 'medium', 'large'].map(async (variantKey) => {
      try {
        await fs.unlink(variantPaths[variantKey]);
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
    }),
  );
}

function attachVariantFields(record, sourceField, fieldPrefix) {
  if (!record) {
    return record;
  }

  if (record[sourceField] && !isLocalUploadUrl(record[sourceField]) && !isDataUrl(record[sourceField])) {
    return {
      ...record,
      [sourceField]: '',
      [`${fieldPrefix}ThumbUrl`]: '',
      [`${fieldPrefix}MediumUrl`]: '',
      [`${fieldPrefix}LargeUrl`]: '',
      [`${fieldPrefix}Variants`]: null,
    };
  }

  const variants = buildVariantUrlMap(record[sourceField]);
  if (!variants) {
    return record;
  }

  return {
    ...record,
    [`${fieldPrefix}ThumbUrl`]: variants.thumb,
    [`${fieldPrefix}MediumUrl`]: variants.medium,
    [`${fieldPrefix}LargeUrl`]: variants.large,
    [`${fieldPrefix}Variants`]: variants,
  };
}

export function attachImageVariants(record, sourceField = 'ImageUrl') {
  return attachVariantFields(record, sourceField, 'Image');
}

export function attachImageVariantsToList(records, sourceField = 'ImageUrl') {
  return Array.isArray(records) ? records.map((record) => attachImageVariants(record, sourceField)) : [];
}

export function attachFileVariants(record, sourceField = 'FileUrl') {
  return attachVariantFields(record, sourceField, 'File');
}

export function attachFileVariantsToList(records, sourceField = 'FileUrl') {
  return Array.isArray(records) ? records.map((record) => attachFileVariants(record, sourceField)) : [];
}

export function getAllUploadOriginalFiles(filePaths) {
  return Array.from(
    new Set(
      filePaths
        .filter(Boolean)
        .map((filePath) => path.resolve(filePath))
        .filter((filePath) => !isVariantFileName(path.basename(filePath))),
    ),
  );
}

export function toUploadUrlFromPath(filePath) {
  const relativePath = path.relative(uploadsDir, path.resolve(filePath));
  if (!relativePath || relativePath.startsWith('..')) {
    return null;
  }

  return `${UPLOADS_PREFIX}${toPosixPath(relativePath)}`;
}
