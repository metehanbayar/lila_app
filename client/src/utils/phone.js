export const TURKISH_PHONE_PLACEHOLDER = '0555 123 45 67';

function toDigits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeTurkishPhone(value = '') {
  let digits = toDigits(value);

  if (digits.startsWith('90') && digits.length > 10) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.startsWith('0')) {
    return digits.slice(0, 11);
  }

  return digits.slice(0, 10);
}

export function formatTurkishPhoneInput(value = '') {
  const digits = normalizeTurkishPhone(value);

  if (!digits) {
    return '';
  }

  const groups = digits.startsWith('0')
    ? [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)]
    : [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];

  return groups.filter(Boolean).join(' ');
}

export function isValidTurkishMobilePhone(value = '') {
  return /^(05|5)\d{9}$/.test(normalizeTurkishPhone(value));
}

export function toOrderPhone(value = '') {
  const normalized = normalizeTurkishPhone(value);

  if (normalized.startsWith('0') && normalized.length === 11) {
    return normalized.slice(1);
  }

  return normalized;
}
