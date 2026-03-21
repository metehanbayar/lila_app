# Asist SMS Entegrasyonu

Bu doküman, mevcut Asist SMS entegrasyonunun hangi env alanlarını kullandığını ve runtime davranışını özetler.

## Gerekli Env Alanları

`server/.env` içine şu alanları ekleyin:

```env
SMS_USERNAME=your_username
SMS_PASSWORD=your_password
SMS_USERCODE=your_usercode
SMS_ACCOUNTID=your_accountid
SMS_ORIGINATOR=LILAGSTO
```

Alan anlamları:

- `SMS_USERNAME`: Asist kullanıcı adı
- `SMS_PASSWORD`: Asist şifresi
- `SMS_USERCODE`: Asist kullanıcı kodu
- `SMS_ACCOUNTID`: Asist hesap ID
- `SMS_ORIGINATOR`: onaylı SMS başlığı

## Çalışma Mantığı

Kod tarafında entegrasyon dosyası:

```text
server/config/sms.js
```

Akış:

1. Telefon numarası rakamlara indirgenir.
2. Numara `90XXXXXXXXXX` formatına çevrilir.
3. SOAP XML oluşturulur.
4. İstek Asist endpoint'ine gönderilir.
5. `ErrorCode` değeri kontrol edilir.

## Development Davranışı

Şu durumlardan biri varsa gerçek SMS isteği atılmaz:

- `NODE_ENV=development`
- `SMS_USERNAME` boş

Bu durumda `sendSMS(...)` başarılı kabul edilir ve OTP akışı dış servise gitmeden devam eder.

Development örneği:

```env
NODE_ENV=development
SMS_USERNAME=
SMS_PASSWORD=
SMS_USERCODE=
SMS_ACCOUNTID=
```

## Production Davranışı

Canlı ortamda gerçek SMS göndermek için `NODE_ENV=production` kullanılmalı ve tüm `SMS_*` alanları dolu olmalıdır:

```env
NODE_ENV=production
SMS_USERNAME=actual_username
SMS_PASSWORD=actual_password
SMS_USERCODE=actual_usercode
SMS_ACCOUNTID=actual_accountid
SMS_ORIGINATOR=LILAGSTO
```

## Telefon Formatı

Asist tarafına giden format:

- `05551234567` -> `905551234567`
- `5551234567` -> `905551234567`
- `905551234567` -> `905551234567`

## Sık Hata Kodları

| Kod | Anlamı |
| --- | --- |
| `0` | Başarılı |
| `-13` | Geçersiz gönderici bilgisi |
| `-16` | Geçersiz alıcı bilgisi |
| `-22` | Yetkisiz IP adresi |
| `-30` | API kullanım yetkisi aktif değil |
| `-31` | Mesaj içeriğinde yasaklı kelime var |
| `-1000` | Sistem hatası |

## Operasyon Notları

- `SMS_ORIGINATOR` Asist tarafında onaylı olmalıdır.
- Sunucu IP adresi yetkili listede olmalıdır.
- Üretim ortamında ayrıntılı SOAP request/response log'u varsayılan olarak tutulmaz.
- OTP akışı `server/routes/otp.js` üzerinden bu entegrasyonu kullanır.

## Sorun Giderme

### SMS gitmiyor

- `SMS_*` alanlarını tekrar kontrol edin.
- Hata `-22` ise IP yetkisini doğrulayın.
- Hata `-13` ise originator onayını kontrol edin.
- Development ortamında gerçek SMS gitmemesi beklenen davranıştır.

### OTP endpoint'i başarılı dönüyor ama SMS düşmüyor

- Ortam `development` olabilir.
- `SMS_USERNAME` boş olabilir.
- `server/config/sms.js` içinde entegrasyon development fallback'ine düşüyor olabilir.

## Referanslar

- WSDL: [https://webservice.asistiletisim.com.tr/smsproxy.asmx?wsdl](https://webservice.asistiletisim.com.tr/smsproxy.asmx?wsdl)
- Dokümantasyon: [https://dosya.asistbt.com.tr/smsproxywebservice.pdf](https://dosya.asistbt.com.tr/smsproxywebservice.pdf)
