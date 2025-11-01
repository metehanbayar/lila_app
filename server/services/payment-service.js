import axios from 'axios';
import https from 'https';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import {
  getPaymentUrls,
  getMerchantConfig,
  getCurrencyCode,
  getCallbackUrls,
} from '../config/payment.js';

// XML Parser ve Builder yapılandırması
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
  parseTagValue: true,
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

/**
 * 3D Secure Enrollment Kontrolü
 * Kartın 3D Secure programına dahil olup olmadığını kontrol eder
 * @param {Object} params - Enrollment parametreleri
 * @param {string} params.pan - Kart numarası
 * @param {string} params.expiryDate - Son kullanma tarihi (YYAA formatında, örn: 2503)
 * @param {number} params.purchaseAmount - Sipariş tutarı
 * @param {string} params.currency - Para birimi kodu (949 = TRY)
 * @param {string} params.verifyEnrollmentRequestId - Benzersiz işlem ID'si
 * @param {string} params.successUrl - Başarılı callback URL'i
 * @param {string} params.failureUrl - Başarısız callback URL'i
 * @param {number} params.installmentCount - Taksit sayısı (0 = peşin)
 * @returns {Promise<Object>} - Enrollment sonucu
 */
export async function checkEnrollment(params) {
  try {
    const {
      pan,
      expiryDate,
      purchaseAmount,
      currency = getCurrencyCode(),
      verifyEnrollmentRequestId,
      successUrl,
      failureUrl,
      installmentCount = 0,
      brandName = '', // Kart markası (100=Visa, 200=MasterCard, vb.)
    } = params;

    const merchant = getMerchantConfig();
    const urls = getPaymentUrls();

    // Debug: Merchant bilgilerini logla (password hariç)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Merchant Config:', {
        merchantId: merchant.merchantId,
        terminalNo: merchant.terminalNo,
        passwordSet: merchant.merchantPassword ? 'YES' : 'NO',
      });
    }

    // Enrollment request parametrelerini hazırla
    // NOT: Vakıf Bankası dokümantasyonuna göre Enrollment request'te TerminalNo GÖNDERİLMEZ
    // TerminalNo sadece VPOS (provizyon) aşamasında kullanılır
    // NOT: Örnek kodlara göre SuccessUrl/FailureUrl (bizdeki gibi) veya SuccessURL/FailureURL kullanılabilir
    // Her ikisi de çalışır, dokümantasyona göre SuccessUrl/FailureUrl kullanıyoruz
    const enrollmentData = new URLSearchParams({
      Pan: pan,
      ExpiryDate: expiryDate,
      PurchaseAmount: purchaseAmount.toFixed(2),
      Currency: currency,
      VerifyEnrollmentRequestId: verifyEnrollmentRequestId,
      MerchantId: merchant.merchantId,
      MerchantPassword: merchant.merchantPassword,
      SuccessUrl: successUrl, // VakıfBank örneklerinde hem SuccessUrl hem SuccessURL var, ikisi de çalışır
      FailureUrl: failureUrl,  // VakıfBank örneklerinde hem FailureUrl hem FailureURL var, ikisi de çalışır
      // InstallmentCount sadece taksit yapılıyorsa gönder (0 = peşin, parametre gönderme)
      ...(installmentCount > 0 && { InstallmentCount: installmentCount.toString() }),
      ...(brandName && { BrandName: brandName }),
    });

    console.log('🔐 3D Secure Enrollment kontrolü yapılıyor...');
    console.log('📋 Request ID:', verifyEnrollmentRequestId);
    console.log('💳 Kart No:', pan.substring(0, 4) + '****' + pan.substring(pan.length - 4));
    console.log('🏢 Merchant ID:', merchant.merchantId);
    console.log('🏧 Terminal No:', merchant.terminalNo);
    console.log('🌐 MPI URL:', urls.mpiEnrollmentUrl);
    console.log('💰 Tutar:', purchaseAmount, 'Currency:', currency);
    console.log('📤 Request Params:', {
      Pan: pan.substring(0, 4) + '****',
      ExpiryDate: expiryDate,
      PurchaseAmount: purchaseAmount.toFixed(2),
      Currency: currency,
      VerifyEnrollmentRequestId: verifyEnrollmentRequestId,
      MerchantId: merchant.merchantId,
      MerchantPassword: merchant.merchantPassword ? '***SET***' : 'NOT SET',
      // TerminalNo Enrollment request'te gönderilmez (sadece VPOS'ta kullanılır)
      SuccessUrl: successUrl,
      FailureUrl: failureUrl,
      InstallmentCount: installmentCount > 0 ? installmentCount.toString() : '0 (not sent)',
    });

    // MPI Enrollment servisine istek gönder
    // Not: Vakıf Bankası bazı durumlarda SSL sertifika kontrolü veya User-Agent ister
    const response = await axios.post(
      urls.mpiEnrollmentUrl,
      enrollmentData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; VPOS724/1.0)',
        },
        timeout: 30000,
        validateStatus: function (status) {
          // Vakıf Bankası bazen HTTP 200 döndürüp XML içinde hata gönderebilir
          return status >= 200 && status < 500;
        },
        httpsAgent: new https.Agent({
          // SSL sertifika kontrolü: Test'te bazen self-signed sertifikalar olabilir
          rejectUnauthorized: process.env.VAKIF_SKIP_SSL_VERIFY !== 'true',
        }),
      }
    );

    // XML yanıtını parse et
    const responseXml = response.data;
    const parsedResponse = xmlParser.parse(responseXml);

    console.log('📥 Enrollment Response:', JSON.stringify(parsedResponse, null, 2));

    // Vakıf Bankası response formatı: IPaySecure -> Message -> VERes
    const ipaySecure = parsedResponse?.IPaySecure || parsedResponse?.ipaySecure;
    const message = ipaySecure?.Message || ipaySecure?.message;
    const veres = message?.VERes || message?.veres || message?.VEResResponse;
    
    // Alternatif formatlar (direkt VerifyEnrollmentResponse veya farklı formatlar)
    const verifyEnrollmentResponse = 
      veres || 
      ipaySecure?.VerifyEnrollmentResponse ||
      parsedResponse?.VerifyEnrollmentResponse || 
      parsedResponse;

    // Status kontrolü - VERes altındaki Status'ü al
    const status = 
      veres?.Status || 
      verifyEnrollmentResponse?.Status || 
      verifyEnrollmentResponse?.status;

    // Error kontrolü
    const messageErrorCode = ipaySecure?.MessageErrorCode || verifyEnrollmentResponse?.MessageErrorCode || verifyEnrollmentResponse?.messageErrorCode;
    const errorMessage = ipaySecure?.ErrorMessage || verifyEnrollmentResponse?.ErrorMessage || verifyEnrollmentResponse?.errorMessage;

    // ACS URL, TermUrl ve MD bilgilerini al (3D Secure için gerekli)
    const acsUrl = verifyEnrollmentResponse?.ACSUrl || verifyEnrollmentResponse?.acsUrl || ipaySecure?.ACSUrl || ipaySecure?.ACSURL || veres?.ACSUrl;
    const termUrl = verifyEnrollmentResponse?.TermUrl || verifyEnrollmentResponse?.termUrl || ipaySecure?.TermUrl || veres?.TermUrl;
    const md = verifyEnrollmentResponse?.MD || verifyEnrollmentResponse?.md || ipaySecure?.MD || veres?.MD;
    const paReq = verifyEnrollmentResponse?.PaReq || verifyEnrollmentResponse?.paReq || ipaySecure?.PaReq || veres?.PaReq;
    const actualBrand = verifyEnrollmentResponse?.ACTUALBRAND || ipaySecure?.ACTUALBRAND || veres?.ACTUALBRAND;

    // Özel durum: Status "E" olsa bile ACS URL varsa kart 3D Secure'a kayıtlı demektir
    // Bazı durumlarda "Issuer Exception" (hata kodu 7) gelse bile ACS URL'leri döner
    if ((status === 'E' || status === 'e') && acsUrl && termUrl && md) {
      console.log('⚠️ Status "E" ama ACS URL mevcut - 3D Secure akışına devam ediliyor');
      console.log('📋 ACS URL:', acsUrl);
      console.log('📋 TermUrl:', termUrl);
      console.log('📋 MD:', md.substring(0, 50) + '...');
      
      return {
        success: true,
        enrolled: true,
        status: 'Y', // 3D Secure gerektiği için Y olarak işaretle
        paReq: paReq,
        acsUrl: acsUrl,
        termUrl: termUrl,
        md: md,
        actualBrand: actualBrand,
        messageErrorCode: messageErrorCode,
        warning: errorMessage ? `Uyarı: ${errorMessage}` : null,
      };
    }

    // Gerçek hata durumu (Status = "E" ve ACS URL yok)
    if (status === 'E' || status === 'e') {
      console.error('❌ Enrollment Hatası:', {
        status,
        messageErrorCode,
        errorMessage,
        hasAcsUrl: !!acsUrl,
      });
      
      // Eğer MessageErrorCode kritik değilse ve sadece uyarı ise
      if (messageErrorCode === '7' && acsUrl) {
        // Issuer Exception ama ACS URL var - devam edebiliriz
        return {
          success: true,
          enrolled: true,
          status: 'Y',
          paReq: paReq,
          acsUrl: acsUrl,
          termUrl: termUrl,
          md: md,
          actualBrand: actualBrand,
          messageErrorCode: messageErrorCode,
          warning: errorMessage,
        };
      }
      
      return {
        success: false,
        enrolled: false,
        status: status || 'E',
        errorCode: messageErrorCode?.toString() || 'UNKNOWN',
        errorMessage: errorMessage || 'Enrollment kontrolü başarısız',
        message: errorMessage || `Hata Kodu: ${messageErrorCode || 'Bilinmeyen'}`,
      };
    }

    if (status === 'Y' || status === 'y') {
      // Kart 3D Secure programına dahil
      return {
        success: true,
        enrolled: true,
        status: 'Y',
        paReq: paReq,
        acsUrl: acsUrl,
        termUrl: termUrl,
        md: md,
        actualBrand: actualBrand,
        messageErrorCode: messageErrorCode,
      };
    } else if (status === 'N' || status === 'n') {
      // Kart 3D Secure programına dahil değil (Half Secure işlem yapılabilir)
      return {
        success: true,
        enrolled: false,
        status: 'N',
        messageErrorCode: messageErrorCode,
      };
    } else {
      // Bilinmeyen durum
      return {
        success: false,
        enrolled: false,
        status: status || 'UNKNOWN',
        errorCode: messageErrorCode?.toString() || 'UNKNOWN',
        errorMessage: errorMessage || 'Bilinmeyen yanıt durumu',
        message: `Bilinmeyen durum: ${status || 'N/A'}`,
      };
    }
  } catch (error) {
    console.error('❌ Enrollment hatası:', error);
    return {
      success: false,
      enrolled: false,
      error: error.message,
      message: 'Enrollment kontrolü sırasında bir hata oluştu',
    };
  }
}

/**
 * 3D Secure olmadan Normal (Non-Secure) Ödeme İşlemi
 * @param {Object} params - Ödeme parametreleri
 * @param {string} params.pan - Kart numarası
 * @param {string} params.expiryDate - Son kullanma tarihi (YYAA)
 * @param {string} params.cvv - CVV kodu
 * @param {number} params.amount - Ödeme tutarı
 * @param {string} params.transactionId - Benzersiz işlem ID'si
 * @param {string} params.clientIp - Müşteri IP adresi
 * @param {number} params.installmentCount - Taksit sayısı (0 = peşin)
 * @returns {Promise<Object>} - Ödeme sonucu
 */
export async function processNonSecurePayment(params) {
  try {
    const {
      pan,
      expiryDate,
      cvv,
      amount,
      transactionId,
      clientIp,
      installmentCount = 0,
    } = params;

    const merchant = getMerchantConfig();
    const urls = getPaymentUrls();

    // XML request oluştur
    const vposRequest = {
      VposRequest: {
        MerchantId: merchant.merchantId,
        Password: merchant.merchantPassword,
        TerminalNo: merchant.terminalNo,
        TransactionType: 'Sale',
        TransactionId: transactionId,
        CurrencyAmount: amount.toFixed(2),
        CurrencyCode: getCurrencyCode(),
        Pan: pan,
        Expiry: expiryDate,
        Cvv: cvv,
        TransactionDeviceSource: '0', // 0 = E-Commerce
        ClientIp: clientIp,
        // VPOS'ta taksit alanı NumberOfInstallments (2 haneli) olarak gönderilmelidir
        ...(installmentCount > 0 && { NumberOfInstallments: installmentCount.toString().padStart(2, '0') }),
      },
    };

    // XML string'e çevir
    const xmlString = xmlBuilder.build(vposRequest);
    const requestBody = `prmstr=${encodeURIComponent(xmlString)}`;

    console.log('💳 Non-Secure ödeme işlemi gönderiliyor...');
    console.log('📋 Transaction ID:', transactionId);
    console.log('💰 Tutar:', amount);

    // Sanal POS servisine istek gönder
    const response = await axios.post(
      urls.vposUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    // XML yanıtını parse et
    const responseText = response.data;
    const parsedResponse = xmlParser.parse(responseText);

    console.log('📥 VPOS Response:', JSON.stringify(parsedResponse, null, 2));

    // Response yapısını kontrol et
    const vposResponse = parsedResponse?.VposResponse || parsedResponse?.vposResponse || parsedResponse;

    // ResultCode kontrolü (0000 = başarılı, Vakıf Bankası dokümantasyonu)
    const resultCode = vposResponse?.ResultCode || vposResponse?.resultCode;
    const resultDetail = vposResponse?.ResultDetail || vposResponse?.resultDetail || '';

    // Başarılı: 0000 veya 00
    if (resultCode === '0000' || resultCode === '00') {
      // Ödeme başarılı
      return {
        success: true,
        resultCode: resultCode,
        resultDetail: resultDetail,
        transactionId: vposResponse?.TransactionId || vposResponse?.transactionId || transactionId,
        rrn: vposResponse?.Rrn || vposResponse?.rrn,
        stan: vposResponse?.Stan || vposResponse?.stan,
        authCode: vposResponse?.AuthCode || vposResponse?.authCode,
        orderId: vposResponse?.OrderId || vposResponse?.orderId,
        responseMessage: resultDetail,
        rawResponse: responseText,
      };
    } else {
      // Ödeme başarısız
      return {
        success: false,
        resultCode: resultCode,
        resultDetail: resultDetail,
        errorMessage: resultDetail,
        rawResponse: responseText,
      };
    }
  } catch (error) {
    console.error('❌ Non-Secure ödeme hatası:', error);
    return {
      success: false,
      error: error.message,
      message: 'Ödeme işlemi sırasında bir hata oluştu',
    };
  }
}

/**
 * 3D Secure ile Ödeme İşlemi (Full Secure)
 * PARes (Payment Authentication Response) alındıktan sonra provizyon yapılır
 * @param {Object} params - Ödeme parametreleri
 * @param {string} params.md - Merchant Data (MPI'den dönen)
 * @param {string} params.paRes - Payment Authentication Response (MPI'den dönen)
 * @param {string} params.pan - Kart numarası (güvenlik için ayrı gönderilmez, ECI ve CAVV kullanılır)
 * @param {number} params.amount - Ödeme tutarı
 * @param {string} params.transactionId - Benzersiz işlem ID'si
 * @param {string} params.clientIp - Müşteri IP adresi
 * @param {string} params.eci - Electronic Commerce Indicator (MPI'den dönen)
 * @param {string} params.cavv - Cardholder Authentication Verification Value (MPI'den dönen)
 * @param {number} params.installmentCount - Taksit sayısı (0 = peşin)
 * @returns {Promise<Object>} - Ödeme sonucu
 */
export async function process3DSecurePayment(params) {
  try {
    const {
      md,
      paRes,
      amount,
      transactionId,
      clientIp,
      eci,
      cavv,
      installmentCount = 0,
      verifyEnrollmentRequestId, // MpiTransactionId olarak gönderilecek
    } = params;

    const merchant = getMerchantConfig();
    const urls = getPaymentUrls();

    // Vakıf Bankası dokümantasyonuna göre:
    // - ECI ve CAVV 3D Secure işlemlerde zorunlu
    // - MpiTransactionId zorunlu (VerifyEnrollmentRequestId değeri)
    // - Pan, Expiry, Cvv gönderilmez (Half Secure hariç)

    // XML request oluştur (3D Secure için)
    // Dokümantasyona göre:
    // - ECI zorunlu (3D Secure için)
    // - CAVV varsa gönderilmeli, yoksa gönderilmemeli (boş string gönderilmemeli)
    // - MpiTransactionId zorunlu (VerifyEnrollmentRequestId değeri)
    // - NumberOfInstallments: 2 haneli format (02, 04, 12 vb.)
    const vposRequest = {
      VposRequest: {
        MerchantId: merchant.merchantId,
        Password: merchant.merchantPassword,
        TerminalNo: merchant.terminalNo,
        TransactionType: 'Sale',
        TransactionId: transactionId,
        CurrencyAmount: amount.toFixed(2),
        CurrencyCode: getCurrencyCode(),
        ECI: eci,
        // CAVV sadece varsa gönder (boş string gönderilmemeli)
        ...(cavv && cavv.trim() !== '' && { CAVV: cavv }),
        MpiTransactionId: verifyEnrollmentRequestId, // Zorunlu - Enrollment aşamasındaki VerifyEnrollmentRequestId
        TransactionDeviceSource: '0', // 0 = E-Commerce
        ClientIp: clientIp,
        // NumberOfInstallments: 2 haneli format (02, 04, 12 vb.) - dokümantasyon 1503. satır
        ...(installmentCount > 0 && { NumberOfInstallments: installmentCount.toString().padStart(2, '0') }),
      },
    };

    // XML string'e çevir
    const xmlString = xmlBuilder.build(vposRequest);
    const requestBody = `prmstr=${encodeURIComponent(xmlString)}`;

    console.log('🔐 3D Secure ödeme işlemi gönderiliyor...');
    console.log('📋 Transaction ID:', transactionId);
    console.log('💰 Tutar:', amount);
    console.log('🔑 ECI:', eci);

    // Sanal POS servisine istek gönder
    const response = await axios.post(
      urls.vposUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    // XML yanıtını parse et
    const responseText = response.data;
    const parsedResponse = xmlParser.parse(responseText);

    console.log('📥 3D Secure VPOS Response:', JSON.stringify(parsedResponse, null, 2));

    // Response yapısını kontrol et
    const vposResponse = parsedResponse?.VposResponse || parsedResponse?.vposResponse || parsedResponse;

    // ResultCode kontrolü (0000 = başarılı, Vakıf Bankası dokümantasyonu)
    const resultCode = vposResponse?.ResultCode || vposResponse?.resultCode;
    const resultDetail = vposResponse?.ResultDetail || vposResponse?.resultDetail || '';

    // Başarılı: 0000 veya 00
    if (resultCode === '0000' || resultCode === '00') {
      // Ödeme başarılı
      return {
        success: true,
        resultCode: resultCode,
        resultDetail: resultDetail,
        transactionId: vposResponse?.TransactionId || vposResponse?.transactionId || transactionId,
        rrn: vposResponse?.Rrn || vposResponse?.rrn,
        stan: vposResponse?.Stan || vposResponse?.stan,
        authCode: vposResponse?.AuthCode || vposResponse?.authCode,
        orderId: vposResponse?.OrderId || vposResponse?.orderId,
        responseMessage: resultDetail,
        rawResponse: responseText,
      };
    } else {
      // Ödeme başarısız
      return {
        success: false,
        resultCode: resultCode,
        resultDetail: resultDetail,
        errorMessage: resultDetail,
        rawResponse: responseText,
      };
    }
  } catch (error) {
    console.error('❌ 3D Secure ödeme hatası:', error);
    return {
      success: false,
      error: error.message,
      message: '3D Secure ödeme işlemi sırasında bir hata oluştu',
    };
  }
}

/**
 * PARes (Payment Authentication Response) Parse
 * MPI callback'inden dönen PARes'i parse eder ve ECI, CAVV gibi değerleri çıkarır
 * @param {string} paRes - PARes string'i (MPI'den gelen)
 * @returns {Object} - Parse edilmiş PARes bilgileri
 */
export function parsePARes(paRes) {
  try {
    // PARes base64 decode edilmiş XML string
    // Bu kısım gerçek implementasyona göre değişebilir
    const decoded = Buffer.from(paRes, 'base64').toString('utf-8');
    const parsed = xmlParser.parse(decoded);

    // PARes yapısından ECI ve CAVV çıkar
    const message = parsed?.Message || parsed?.message;
    const eci = message?.VERes?.VEReq?.ECI || message?.PARes?.AuthResult?.ECI;
    const cavv = message?.PARes?.AuthResult?.CAVV || message?.PARes?.authResult?.cavv;
    const authenticationValue = message?.PARes?.AuthResult?.AuthenticationValue || message?.PARes?.authResult?.authenticationValue;

    return {
      success: true,
      eci: eci,
      cavv: cavv || authenticationValue,
      status: message?.PARes?.AuthResult?.Status || message?.PARes?.authResult?.status,
      raw: decoded,
    };
  } catch (error) {
    console.error('❌ PARes parse hatası:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  checkEnrollment,
  processNonSecurePayment,
  process3DSecurePayment,
  parsePARes,
};

