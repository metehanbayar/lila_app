function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const PLACEHOLDER_PATTERNS = [
  /vs\s*vs/i,
  /aciklama\s+yazar/i,
  /açıklama\s+yazar/i,
  /\byazariz\b/i,
  /\blorem\b/i,
  /\bdummy\b/i,
  /\btest\b/i,
  /\bdeneme\b/i,
  /\bornek\b/i,
  /\börnek\b/i,
];

const INTERNAL_CAMPAIGN_PATTERNS = [
  /\bilksiparis\b/i,
  /\bilk\s*siparis\b/i,
  /\bmete\b/i,
  /\batakan\b/i,
  /\bdemo\b/i,
  /\btest\b/i,
];

export function looksLikePlaceholderText(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return true;
  }

  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function getSafeRestaurantDescription(restaurant, fallback = 'Menüyü inceleyin.') {
  const description = normalizeText(restaurant?.Description || restaurant?.description);

  if (!description || looksLikePlaceholderText(description)) {
    return fallback;
  }

  return description;
}

function getCampaignBenefitTitle(campaign) {
  const discountValue = Number(campaign?.DiscountValue);
  const normalizedType = String(campaign?.DiscountType || '').trim().toLowerCase();

  if (Number.isFinite(discountValue) && discountValue > 0) {
    if (normalizedType === 'percentage') {
      return `%${discountValue} indirim`;
    }

    if (normalizedType === 'fixed') {
      return `${discountValue} TL indirim`;
    }
  }

  return 'Bugune ozel kampanya';
}

function looksLikeInternalCampaignTitle(value, code) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return true;
  }

  if (code && normalized.toLowerCase() === normalizeText(code).toLowerCase()) {
    return true;
  }

  if (INTERNAL_CAMPAIGN_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const letters = normalized.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '');
  const uppercaseLetters = normalized.replace(/[^A-ZÇĞİÖŞÜ]/g, '');
  const uppercaseRatio = letters.length ? uppercaseLetters.length / letters.length : 0;

  return uppercaseRatio > 0.85 && normalized.length <= 24;
}

export function getSafeCampaignTitle(campaign) {
  const title = normalizeText(campaign?.DisplayTitle);

  if (!looksLikeInternalCampaignTitle(title, campaign?.Code)) {
    return title;
  }

  return getCampaignBenefitTitle(campaign);
}

export function getSafeCampaignSubtitle(campaign, { title = '', summary = '' } = {}) {
  const subtitle = normalizeText(campaign?.DisplaySubtitle || campaign?.Description);

  if (!subtitle || looksLikePlaceholderText(subtitle)) {
    return '';
  }

  if (subtitle === title || subtitle === summary) {
    return '';
  }

  return subtitle;
}
