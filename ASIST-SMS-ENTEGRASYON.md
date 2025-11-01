# Asist SMS Web Servisi Entegrasyonu

Bu dokümantasyon, Asist SMS web servisi ile OTP doğrulama sisteminin entegrasyonunu açıklamaktadır.

## 📚 Referanslar

- **WSDL URL**: https://webservice.asistiletisim.com.tr/smsproxy.asmx?wsdl
- **Dokümantasyon**: https://dosya.asistbt.com.tr/smsproxywebservice.pdf
- **Destek**: destek@asistbt.com.tr
- **Telefon**: (0216) 6570844

## 🔧 Konfigürasyon

### Gerekli Parametreler

`.env` dosyasına aşağıdaki parametreleri ekleyin:

```env
# Asist SMS Konfigürasyonu
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
SMS_USERCODE=your_usercode
SMS_ACCOUNTID=your_accountid
SMS_ORIGINATOR=LILAGSTO
```

### Parametrelerin Açıklamaları

| Parametre | Açıklama | Örnek |
|-----------|----------|-------|
| `SMS_USERNAME` | Asist kullanıcı adı | `user@company.com` |
| `SMS_PASSWORD` | Asist şifresi | `yourpassword` |
| `SMS_USERCODE` | Kullanıcı kodu (Asist'ten alınır) | `12345` |
| `SMS_ACCOUNTID` | Hesap ID (Asist'ten alınır) | `67890` |
| `SMS_ORIGINATOR` | SMS başlığı (Asist'te tanımlı olmalı) | `LILAGSTO` |

## 📡 Web Servisi Detayları

### SOAP Request Yapısı

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:sms="https://webservice.asistiletisim.com.tr/SmsProxy">
  <soap:Body>
    <sms:SendSms>
      <sms:requestXml><![CDATA[
        <SendSmsRequest>
          <Username>your_username</Username>
          <Password>your_password</Password>
          <UserCode>your_usercode</UserCode>
          <AccountId>your_accountid</AccountId>
          <Originator>LILAGSTO</Originator>
          <Message><![CDATA[Dogrulama kodunuz: 123456]]></Message>
          <IsOtp>false</IsOtp>
          <Messages>
            <Message>
              <Msisdn>905551234567</Msisdn>
            </Message>
          </Messages>
        </SendSmsRequest>
      ]]></sms:requestXml>
    </sms:SendSms>
  </soap:Body>
</soap:Envelope>
```

### SOAP Response Yapısı

#### Başarılı Yanıt
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendSmsResponse xmlns="https://webservice.asistiletisim.com.tr/SmsProxy">
      <SendSmsResult>
        <ErrorCode>0</ErrorCode>
        <PacketId>123456789</PacketId>
        <DetailIdList>
          <DetailId>987654321</DetailId>
        </DetailIdList>
      </SendSmsResult>
    </SendSmsResponse>
  </soap:Body>
</soap:Envelope>
```

#### Hatalı Yanıt
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <SendSmsResponse xmlns="https://webservice.asistiletisim.com.tr/SmsProxy">
      <SendSmsResult>
        <ErrorCode>-16</ErrorCode>
        <ErrorDescription>Geçersiz alıcı bilgisi</ErrorDescription>
      </SendSmsResult>
    </SendSmsResponse>
  </soap:Body>
</soap:Envelope>
```

## 🔢 Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `0` | Başarılı |
| `-1` | Girilen bilgilere sahip bir kullanıcı bulunamadı |
| `-2` | Kullanıcı pasif durumda |
| `-3` | Kullanıcı bloke durumda |
| `-13` | Geçersiz gönderici bilgisi (Originator) |
| `-15` | Mesaj içeriği boş veya limit aşıldı |
| `-16` | Geçersiz alıcı bilgisi (telefon numarası) |
| `-20` | Bilgilendirme mesajı almak istemiyor |
| `-21` | Numara karalistede |
| `-22` | Yetkisiz IP Adresi |
| `-23` | Kullanıcı yetkisi bulunmamaktadır |
| `-30` | Kullanıcının API kullanım yetkisi aktif değil |
| `-31` | Mesaj içerisinde yasaklı kelime kullanıldı |
| `-1000` | Sistem hatası |

## 📱 Telefon Numarası Formatı

Asist SMS, telefon numaralarını `90XXXXXXXXXX` formatında bekler:

| Giriş Formatı | Çıkış Formatı |
|---------------|---------------|
| `05551234567` | `905551234567` |
| `5551234567` | `905551234567` |
| `905551234567` | `905551234567` |

## 🔒 Güvenlik Notları

### IP Kısıtlaması
Asist SMS, güvenlik için IP tabanlı erişim kontrolü kullanır. Sunucunuzun IP adresini Asist'e bildirmeniz gerekmektedir.

**Hata**: `-22 Yetkisiz IP Adresi`  
**Çözüm**: Asist destek ekibine sunucu IP adresinizi bildirin.

### Originator (Başlık) Onayı
SMS başlığınızın (Originator) Asist tarafından onaylanması gerekmektedir.

**Hata**: `-13 Geçersiz gönderici bilgisi`  
**Çözüm**: Asist destek ekibinden başlığınızı onaylatın.

## 🧪 Test ve Geliştirme

### Geliştirme Modu

Geliştirme ortamında SMS gönderimi simüle edilir:

```env
NODE_ENV=development
```

Konsol çıktısı:
```
📱 SMS (DEV MODE - Asist):
To: 05551234567
Message: Lila Gusto giris kodunuz: 123456
Bu kodu kimseyle paylasmayiniz.
---
```

### Production Modu

Production ortamında gerçek SMS gönderimi yapılır:

```env
NODE_ENV=development
SMS_USERNAME=actual_username
SMS_PASSWORD=actual_password
SMS_USERCODE=actual_usercode
SMS_ACCOUNTID=actual_accountid
SMS_ORIGINATOR=LILAGSTO
```

## 🛠️ Kod Yapısı

### SMS Gönderme Fonksiyonu

```javascript
// server/config/sms.js
export const sendSMS = async (phone, message) => {
  // 1. Geliştirme modu kontrolü
  // 2. Telefon numarası formatlama
  // 3. SOAP XML request oluşturma
  // 4. Asist API'ye POST isteği
  // 5. XML response parse etme
  // 6. Hata kodu kontrolü
}
```

### OTP Mesajı Formatı

```javascript
// Kayıt için
"Lila Gusto kayit kodunuz: 123456\nBu kodu kimseyle paylasmayiniz."

// Giriş için
"Lila Gusto giris kodunuz: 123456\nBu kodu kimseyle paylasmayiniz."
```

## 📊 Karakter Limitleri

### GSM 7-bit Alphabet
- Tek mesaj: **160 karakter**
- Concatenated mesaj: Operatöre göre değişir

### UTF-8 Kodlama
- Türkçe karakterler (ğ, ı, ş, vb.) için gerekli
- Karakter sayısı azalır
- Operatöre göre limit değişir

## 🔍 Sorun Giderme

### SMS Gönderilmiyor

1. **Kullanıcı bilgileri kontrolü**
   ```bash
   # .env dosyasını kontrol edin
   cat server/.env | grep SMS_
   ```

2. **IP adresi kontrolü**
   - Sunucu IP adresinizi öğrenin
   - Asist destek ekibine bildirin
   - Hata kodu -22 alıyorsanız IP tanımlı değildir

3. **Originator kontrolü**
   - SMS başlığınız Asist'te tanımlı mı?
   - Hata kodu -13 alıyorsanız başlık onaylı değildir

4. **Kredi kontrolü**
   - Asist hesabınızda yeterli SMS kredisi var mı?
   - Web panelinden kontrol edin

### Debugging

Detaylı log için:

```javascript
// server/config/sms.js içinde
console.log('SOAP Request:', soapRequest);
console.log('SOAP Response:', response.data);
```

## 📞 Destek

### Asist Destek Kanalları

- **E-posta**: destek@asistbt.com.tr (7/24)
- **Telefon**: (0216) 6570844 (Hafta içi 08:00-17:30)
- **Web**: https://www.asistiletisim.com.tr

### Sık Sorulan Sorular

**S: IP adresimi nasıl öğrenebilirim?**  
C: Sunucuda `curl ifconfig.me` komutunu çalıştırın.

**S: Test için ücretsiz SMS kredisi var mı?**  
C: Asist destek ekibiyle iletişime geçin.

**S: Hangi operatörlere SMS gönderebilirim?**  
C: Türkiye'deki tüm operatörlere (Turkcell, Vodafone, Türk Telekom).

## 🔄 Migration

NetGSM'den Asist'e geçiş yapıyorsanız:

1. `.env` dosyasını güncelleyin
2. `SMS_USERCODE` ve `SMS_ACCOUNTID` ekleyin
3. IP adresinizi Asist'e bildirin
4. Originator onaylatın
5. Test edin

## 📝 Notlar

- SOAP web servisi kullanır (RESTful değil)
- XML request/response formatı
- Synchronous (senkron) mesaj gönderimi
- Rate limiting yok (sunucu tarafında uygulanmalı)
- Türkçe karakter desteği var

