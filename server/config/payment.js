import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını server klasöründen yükle
dotenv.config({ path: path.join(__dirname, '../.env') });

// Vakıf Bankası VPOS724 Sanal POS Konfigürasyonu
const paymentConfig = {
  // Ortam: 'test' veya 'production'
  environment: process.env.PAYMENT_ENVIRONMENT || 'production', // Production (gerçek) ortam

  // Vakıf Bankası Üye İşyeri Bilgileri
  merchant: {
    merchantId: process.env.VAKIF_MERCHANT_ID || '000000000001111', // Test için örnek
    merchantPassword: process.env.VAKIF_MERCHANT_PASSWORD || 'test_password', // Test için
    terminalNo: process.env.VAKIF_TERMINAL_NO || '00000001', // Test için örnek
  },

  // Test Ortamı URL'leri (Vakıf Bankası Resmi Dokümantasyon)
  test: {
    // 3D Secure Enrollment (Port: 443 veya 4443 - Port belirtmeden 443 kullanılır)
    mpiEnrollmentUrl: process.env.VAKIF_TEST_MPI_URL || 'https://3dsecuretest.vakifbank.com.tr/MPIAPI/MPI_Enrollment.aspx',
    // Sanal POS ServisUrl (Port: 4443)
    vposUrl: 'https://onlineodemetest.vakifbank.com.tr:4443/VposService/v3/Vposreq.aspx',
  },

  // Production Ortamı URL'leri (Vakıf Bankası Resmi Dokümantasyon)
  production: {
    // 3D Secure Enrollment (Port: 443 veya 4443)
    mpiEnrollmentUrl: process.env.VAKIF_PROD_MPI_URL || 'https://3dsecure.vakifbank.com.tr/MPIAPI/MPI_Enrollment.aspx',
    // Sanal POS ServisUrl (Port: 4443)
    vposUrl: 'https://onlineodeme.vakifbank.com.tr:4443/VposService/v3/Vposreq.aspx',
  },

  // Para Birimi Kodu (949 = TRY)
  currencyCode: process.env.PAYMENT_CURRENCY_CODE || '949',

  // Callback URL'leri (frontend'den alınacak)
  callbacks: {
    successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:5173/payment/success',
    failureUrl: process.env.PAYMENT_FAILURE_URL || 'http://localhost:5173/payment/failure',
  },
};

// Mevcut ortam URL'lerini al
export function getPaymentUrls() {
  return paymentConfig.environment === 'production'
    ? paymentConfig.production
    : paymentConfig.test;
}

// Merchant bilgilerini al
export function getMerchantConfig() {
  return paymentConfig.merchant;
}

// Currency code'u al
export function getCurrencyCode() {
  return paymentConfig.currencyCode;
}

// Callback URL'lerini al
export function getCallbackUrls() {
  return paymentConfig.callbacks;
}

// Ortam kontrolü
export function isProduction() {
  return paymentConfig.environment === 'production';
}

export default paymentConfig;

