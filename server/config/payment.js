import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isProduction as isNodeProduction } from './runtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const paymentConfig = {
  test: {
    mpiEnrollmentUrl:
      process.env.VAKIF_TEST_MPI_URL ||
      'https://3dsecuretest.vakifbank.com.tr/MPIAPI/MPI_Enrollment.aspx',
    vposUrl: 'https://onlineodemetest.vakifbank.com.tr:4443/VposService/v3/Vposreq.aspx',
  },
  production: {
    mpiEnrollmentUrl:
      process.env.VAKIF_PROD_MPI_URL ||
      'https://3dsecure.vakifbank.com.tr/MPIAPI/MPI_Enrollment.aspx',
    vposUrl: 'https://onlineodeme.vakifbank.com.tr:4443/VposService/v3/Vposreq.aspx',
  },
};

let hasShownDevPaymentWarning = false;

function getPaymentEnvironment() {
  return process.env.PAYMENT_ENVIRONMENT || 'test';
}

function getMerchantConfigInternal() {
  return {
    merchantId: process.env.VAKIF_MERCHANT_ID || '',
    merchantPassword: process.env.VAKIF_MERCHANT_PASSWORD || '',
    terminalNo: process.env.VAKIF_TERMINAL_NO || '',
  };
}

function getCallbackConfig() {
  return {
    successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:5173/payment/success',
    failureUrl: process.env.PAYMENT_FAILURE_URL || 'http://localhost:5173/payment/failure',
  };
}

function isLocalhostUrl(value) {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch {
    return value.includes('localhost');
  }
}

export function validatePaymentConfig() {
  const environment = getPaymentEnvironment();

  if (!['test', 'production'].includes(environment)) {
    throw new Error('PAYMENT_ENVIRONMENT must be either "test" or "production".');
  }

  if (!isNodeProduction()) {
    const callbacks = getCallbackConfig();

    if (
      environment === 'production' &&
      (isLocalhostUrl(callbacks.successUrl) || isLocalhostUrl(callbacks.failureUrl)) &&
      !hasShownDevPaymentWarning
    ) {
      hasShownDevPaymentWarning = true;
      console.warn(
        'PAYMENT_ENVIRONMENT=production is active in development. Local callback URLs are allowed for local startup only.'
      );
    }

    return;
  }

  const merchant = getMerchantConfigInternal();
  const callbacks = getCallbackConfig();
  const requiredEntries = [
    ['VAKIF_MERCHANT_ID', merchant.merchantId],
    ['VAKIF_MERCHANT_PASSWORD', merchant.merchantPassword],
    ['VAKIF_TERMINAL_NO', merchant.terminalNo],
    ['PAYMENT_SUCCESS_URL', callbacks.successUrl],
    ['PAYMENT_FAILURE_URL', callbacks.failureUrl],
  ];

  for (const [key, value] of requiredEntries) {
    if (!value) {
      throw new Error(`${key} must be set in production.`);
    }
  }

  if (
    isLocalhostUrl(callbacks.successUrl) ||
    isLocalhostUrl(callbacks.failureUrl)
  ) {
    throw new Error('Payment callback URLs cannot point to localhost in production.');
  }
}

export function getPaymentUrls() {
  validatePaymentConfig();
  return getPaymentEnvironment() === 'production' ? paymentConfig.production : paymentConfig.test;
}

export function getMerchantConfig() {
  validatePaymentConfig();
  return getMerchantConfigInternal();
}

export function getCurrencyCode() {
  return process.env.PAYMENT_CURRENCY_CODE || '949';
}

export function getCallbackUrls() {
  validatePaymentConfig();
  return getCallbackConfig();
}

export function isProduction() {
  return getPaymentEnvironment() === 'production';
}

export default {
  ...paymentConfig,
  environment: getPaymentEnvironment(),
  merchant: getMerchantConfigInternal(),
  currencyCode: getCurrencyCode(),
  callbacks: getCallbackConfig(),
};
