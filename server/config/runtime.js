export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return !isProduction();
}

export function splitEnvList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getAllowedCorsOrigins() {
  return splitEnvList(process.env.CORS_ORIGIN);
}

export function createCorsOriginValidator() {
  const allowedOrigins = getAllowedCorsOrigins();
  const isLocalDevelopmentOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || '');

  if (isProduction() && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be set in production.');
  }

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (!isProduction() && (allowedOrigins.length === 0 || isLocalDevelopmentOrigin(origin))) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS.'));
  };
}

export function isPaymentDebugEnabled() {
  return process.env.PAYMENT_DEBUG === 'true' || !isProduction();
}
