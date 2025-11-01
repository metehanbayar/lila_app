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
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns="https://webservice.asistiletisim.com.tr/SmsProxy">
  <soapenv:Header/>
  <soapenv:Body>
    <sendSms>
      <requestXml><![CDATA[${innerXml}]]></requestXml>
    </sendSms>
  </soapenv:Body>
</soapenv:Envelope>`;
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

    // İç XML oluştur (Asist dokümanına uygun format)
    const innerXml = `<SendSms>
  <Username>${SMS_CONFIG.username}</Username>
  <Password>${SMS_CONFIG.password}</Password>
  <UserCode>${SMS_CONFIG.userCode}</UserCode>
  <AccountId>${SMS_CONFIG.accountId}</AccountId>
  <Originator>${SMS_CONFIG.originator}</Originator>
  <SendDate></SendDate>
  <ValidityPeriod>120</ValidityPeriod>
  <MessageText>${message}</MessageText>
  <IsCheckBlackList>1</IsCheckBlackList>
  <IsEncryptedParameter>0</IsEncryptedParameter>
  <ReceiverList>
    <Receiver>${formattedPhone}</Receiver>
  </ReceiverList>
  <PersonalMessages>
    <PersonalMessage>
      <Parameter>${message}</Parameter>
    </PersonalMessage>
  </PersonalMessages>
</SendSms>`;

    // SOAP request oluştur
    const soapRequest = createSoapRequest(innerXml);
    
    // Asist SMS web servisine istek gönder
    const response = await axios.post(SMS_CONFIG.wsdlUrl, soapRequest, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"https://webservice.asistiletisim.com.tr/SmsProxy/sendSms"',
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
      
      return true;
    } else {
      // Hata mesajını çıkar (Asist dokümanına göre)
      const errorMessages = {
        '0': 'Başarılı',
        '-1': 'Girilen bilgilere sahip bir kullanıcı bulunamadı',
        '-2': 'Kullanıcı pasif durumda',
        '-3': 'Kullanıcı bloke durumda',
        '-4': 'Kullanıcı hesabı bulunamadı',
        '-5': 'Kullanıcı hesabı pasif durumda',
        '-6': 'Kayıt bulunamadı',
        '-7': 'Hatalı xml istek yapısı',
        '-8': 'Alınan parametrelerden biri veya birkaçı hatalı',
        '-9': 'Prepaid hesap bulunamadı',
        '-10': 'Operatör servisinde geçici kesinti',
        '-11': 'Başlangıç tarihi ile şu an ki zaman arasındaki fark 30 dakikadan az',
        '-12': 'Bitiş tarihi ile şu an ki zaman arasındaki fark 30 günden fazla',
        '-13': 'Geçersiz gönderici bilgisi',
        '-14': 'Hesaba ait SMS gönderim yetkisi bulunmuyor',
        '-15': 'Mesaj içeriği boş veya limit olan karakter sayısını aşıyor',
        '-16': 'Geçersiz alıcı bilgisi',
        '-17': 'Parametre adetleri ile şablon içerisindeki parametre adedi uyuşmuyor',
        '-18': 'Gönderim içerisinde birden fazla hata mevcut. MessageId kontrol edilmelidir',
        '-19': 'Mükerrer gönderim isteği',
        '-20': 'Bilgilendirme mesajı almak istemiyor',
        '-21': 'Numara karalistede',
        '-22': 'Yetkisiz IP Adresi',
        '-23': 'Kullanıcı yetkisi bulunmamaktadır',
        '-24': 'Belirtilen paket zaten onaylanmıştır',
        '-25': 'Belirtilen Id için onaylanmamış bir paket bulunamadı',
        '-26': 'Taahhüt süresi zaman aşımına uğradı',
        '-27': 'Taahhüt miktarı aşıldı',
        '-28': 'Kullanıcı gönderim limiti aşıldı',
        '-29': 'Başlangıç tarihi bitiş tarihinden büyük olamaz',
        '-30': 'Kullanıcının API kullanım yetkisi aktif değil',
        '-31': 'Mesaj metni içerisinde yasaklı kelime kullanıldığı için başarısız',
        '-1000': 'SYSTEM_ERROR',
      };
      
      const errorMsg = errorMessages[errorCode.toString()] || `Bilinmeyen hata (Kod: ${errorCode})`;
      return false;
    }
  } catch (error) {
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
 * @param {string} name - Kullanıcı adı soyadı (opsiyonel)
 * @returns {string} - SMS mesajı
 */
export const createOTPMessage = (otp, purpose = 'login', name = '') => {
  const greeting = name ? `Merhaba ${name},` : 'Merhaba,';
  
  if (purpose === 'register') {
    return `${greeting}\nkayit kodunuz: ${otp}\nBu kodu kimseyle paylasmayiniz.`;
  }
  return `${greeting}\ngiris kodunuz: ${otp}\nBu kodu kimseyle paylasmayiniz.`;
};

export default {
  sendSMS,
  generateOTP,
  createOTPMessage,
};

