import axios from 'axios';

// Asist SMS Konfigürasyonu
// Hesap bilgilerinizi .env dosyasına ekleyin:
// SMS_USERNAME=your_username
// SMS_PASSWORD=your_password
// SMS_USERCODE=your_usercode
// SMS_ACCOUNTID=your_accountid
// SMS_ORIGINATOR=your_originator (başlık adı, örn: LILAGSTO)

const SMS_CONFIG = {
  username: process.env.SMS_USERNAME || '',
  password: process.env.SMS_PASSWORD || '',
  userCode: process.env.SMS_USERCODE || '',
  accountId: process.env.SMS_ACCOUNTID || '',
  originator: process.env.SMS_ORIGINATOR || 'LILAGSTO',
  wsdlUrl: 'https://webservice.asistiletisim.com.tr/smsproxy.asmx',
};

/**
 * SOAP XML Request oluştur
 */
const createSoapRequest = (innerXml) => {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sms="https://webservice.asistiletisim.com.tr/SmsProxy">
  <soap:Body>
    <sms:SendSms>
      <sms:requestXml><![CDATA[${innerXml}]]></sms:requestXml>
    </sms:SendSms>
  </soap:Body>
</soap:Envelope>`;
};

/**
 * SMS gönder (Asist SMS API)
 * @param {string} phone - Telefon numarası (5xxxxxxxxx formatında)
 * @param {string} message - Gönderilecek mesaj
 * @returns {Promise<boolean>} - Başarılı ise true
 */
export const sendSMS = async (phone, message) => {
  try {
    // Geliştirme ortamında SMS göndermeyi simüle et
    if (process.env.NODE_ENV === 'development' || !SMS_CONFIG.username) {
      console.log('📱 SMS (DEV MODE - Asist):');
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('---');
      return true;
    }

    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Türkiye telefon numarası formatı (90XXXXXXXXXX)
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '90' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('90')) {
      formattedPhone = cleanPhone;
    } else if (cleanPhone.length === 10) {
      formattedPhone = '90' + cleanPhone;
    }

    // İç XML oluştur
    const innerXml = `<SendSmsRequest>
  <Username>${SMS_CONFIG.username}</Username>
  <Password>${SMS_CONFIG.password}</Password>
  <UserCode>${SMS_CONFIG.userCode}</UserCode>
  <AccountId>${SMS_CONFIG.accountId}</AccountId>
  <Originator>${SMS_CONFIG.originator}</Originator>
  <Message><![CDATA[${message}]]></Message>
  <IsOtp>false</IsOtp>
  <Messages>
    <Message>
      <Msisdn>${formattedPhone}</Msisdn>
    </Message>
  </Messages>
</SendSmsRequest>`;

    // SOAP request oluştur
    const soapRequest = createSoapRequest(innerXml);

    // Asist SMS web servisine istek gönder
    const response = await axios.post(SMS_CONFIG.wsdlUrl, soapRequest, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'https://webservice.asistiletisim.com.tr/SmsProxy/SendSms',
      },
    });

    // XML yanıtı parse et
    const responseText = response.data;
    
    // ErrorCode kontrolü (0 = başarılı)
    const errorCodeMatch = responseText.match(/<ErrorCode>(-?\d+)<\/ErrorCode>/);
    const errorCode = errorCodeMatch ? parseInt(errorCodeMatch[1]) : -1000;

    if (errorCode === 0) {
      // PacketId çıkar
      const packetIdMatch = responseText.match(/<PacketId>(\d+)<\/PacketId>/);
      const packetId = packetIdMatch ? packetIdMatch[1] : 'unknown';
      
      console.log(`✅ SMS gönderildi: ${phone} - Paket ID: ${packetId}`);
      return true;
    } else {
      // Hata mesajını çıkar
      const errorMessages = {
        '-1': 'Girilen bilgilere sahip bir kullanıcı bulunamadı',
        '-2': 'Kullanıcı pasif durumda',
        '-3': 'Kullanıcı bloke durumda',
        '-13': 'Geçersiz gönderici bilgisi',
        '-15': 'Mesaj içeriği boş veya limit aşıldı',
        '-16': 'Geçersiz alıcı bilgisi',
        '-20': 'Bilgilendirme mesajı almak istemiyor',
        '-21': 'Numara karalistede',
        '-22': 'Yetkisiz IP Adresi',
      };
      
      const errorMsg = errorMessages[errorCode] || `Bilinmeyen hata (Kod: ${errorCode})`;
      console.error(`❌ SMS gönderme hatası: ${errorMsg}`);
      return false;
    }
  } catch (error) {
    console.error('SMS gönderme hatası:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
};

/**
 * OTP kodu oluştur
 * @param {number} length - Kod uzunluğu (varsayılan 6)
 * @returns {string} - OTP kodu
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * OTP SMS mesajı oluştur
 * @param {string} otp - OTP kodu
 * @param {string} purpose - Amaç ('register' veya 'login')
 * @returns {string} - SMS mesajı
 */
export const createOTPMessage = (otp, purpose = 'login') => {
  if (purpose === 'register') {
    return `Lila Gusto kayit kodunuz: ${otp}\nBu kodu kimseyle paylasmayiniz.`;
  }
  return `Lila Gusto giris kodunuz: ${otp}\nBu kodu kimseyle paylasmayiniz.`;
};

export default {
  sendSMS,
  generateOTP,
  createOTPMessage,
};

