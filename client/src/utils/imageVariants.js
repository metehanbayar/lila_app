const VARIANT_FIELD_MAP = {
  thumb: 'ImageThumbUrl',
  medium: 'ImageMediumUrl',
  large: 'ImageLargeUrl',
};

const VARIANT_SUFFIX_PATTERN = /__(thumb|medium|large)$/i;

function stripQueryAndHash(value) {
  return String(value || '').split('#')[0].split('?')[0];
}

function isLocalUploadUrl(value) {
  return stripQueryAndHash(value).startsWith('/uploads/');
}

export function deriveImageVariantUrl(imageUrl, variant = 'medium') {
  if (!imageUrl || !isLocalUploadUrl(imageUrl)) {
    return imageUrl || '';
  }

  const normalizedUrl = stripQueryAndHash(imageUrl);
  const slashIndex = normalizedUrl.lastIndexOf('/');
  const directory = slashIndex >= 0 ? normalizedUrl.slice(0, slashIndex + 1) : '/uploads/';
  const fileName = slashIndex >= 0 ? normalizedUrl.slice(slashIndex + 1) : normalizedUrl;
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = (dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName).replace(VARIANT_SUFFIX_PATTERN, '');

  return `${directory}${baseName}__${variant}.webp`;
}

export function resolveImageUrl(entity, variant = 'medium', sourceField = 'ImageUrl') {
  if (!entity) {
    return '';
  }

  const explicitVariantField = VARIANT_FIELD_MAP[variant];
  const explicitVariantUrl = explicitVariantField ? entity[explicitVariantField] : '';
  const sourceUrl = entity[sourceField] || entity.imageUrl || '';

  if (explicitVariantUrl) {
    return explicitVariantUrl;
  }

  return deriveImageVariantUrl(sourceUrl, variant) || sourceUrl;
}

export function getProductListImage(product) {
  return resolveImageUrl(product, 'thumb');
}

export function getProductDetailImage(product) {
  return resolveImageUrl(product, 'large');
}

export function getRestaurantCardImage(restaurant) {
  return resolveImageUrl(restaurant, 'medium');
}

export function getHeroImage(entity) {
  return resolveImageUrl(entity, 'large');
}
