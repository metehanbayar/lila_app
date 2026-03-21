# OTP SMS Doğrulama Sistemi

Bu doküman, mevcut OTP akışının nasıl çalıştığını ve hangi alanların zorunlu olduğunu özetler.

## Genel Akış

- `POST /api/otp/send` doğrulama kodu üretir ve veritabanına kaydeder.
- `POST /api/otp/verify` kodu doğrular.
- `POST /api/customer/register` ve `POST /api/customer/login` OTP doğrulamasından sonra müşteri oturumu açar.
- Başarılı giriş ve kayıt yanıtlarında artık geri çözülebilir credential değil, sunucu tarafında imzalı Bearer token döner.

## Gereksinimler

`server/.env` içinde en az şu alanlar olmalı:

```env
NODE_ENV=development
OTP_ENABLED=true

SMS_USERNAME=
SMS_PASSWORD=
SMS_USERCODE=
SMS_ACCOUNTID=
SMS_ORIGINATOR=LILAGSTO

AUTH_TOKEN_SECRET=change-this-in-production
TOKEN_TTL_HOURS=168
```

Notlar:

- `NODE_ENV=development` veya SMS bilgileri boşsa gerçek SMS isteği atılmaz, akış simüle edilir.
- Production ortamında `AUTH_TOKEN_SECRET` zorunludur ve güçlü olmalıdır.
- Token ömrü `TOKEN_TTL_HOURS` ile belirlenir.

## Veritabanı

OTP için şu migration çalıştırılmalıdır:

```bash
server/database/migrations/add-otp-verification.sql
```

Bu migration:

- `OTPVerification` tablosunu oluşturur
- `Customers` tablosuna `PhoneVerified` alanını ekler
- gerekli indeksleri oluşturur

## Development ve Demo Davranışı

### Development modu

`NODE_ENV=development` ise:

- `/api/otp/send` yanıtında `otp` alanı döner
- SMS servisi dış sağlayıcıya gitmeden başarılı kabul edilir

Örnek:

```json
{
  "success": true,
  "message": "Doğrulama kodu telefonunuza gönderildi",
  "otp": "123456"
}
```

### OTP tamamen kapalıysa

`OTP_ENABLED=false` ise sistem demo moda geçer:

- `/api/otp/send` doğrudan `123456` döner
- `/api/otp/verify` demo modda doğrulamayı başarılı kabul eder
- müşteri kayıt ve giriş akışı OTP bariyerini pratikte atlayabilir, bu yüzden sadece geliştirme ortamında kullanılmalıdır

## API Uçları

### 1. OTP gönder

`POST /api/otp/send`

İstek:

```json
{
  "phone": "05551234567",
  "purpose": "login"
}
```

`purpose` değeri `login` veya `register` olmalıdır.

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Doğrulama kodu telefonunuza gönderildi"
}
```

Rate limit yanıtı:

```json
{
  "success": false,
  "message": "Lütfen 240 saniye sonra tekrar deneyin",
  "waitTime": 240
}
```

Not:

- Aynı telefon ve aynı amaç için 5 dakika içinde tekrar OTP üretilemez.

### 2. OTP doğrula

`POST /api/otp/verify`

İstek:

```json
{
  "phone": "05551234567",
  "otp": "123456",
  "purpose": "login"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Doğrulama başarılı"
}
```

### 3. Kayıt ol

`POST /api/customer/register`

İstek:

```json
{
  "phone": "05551234567",
  "fullName": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "dateOfBirth": "1995-01-15",
  "gender": "male",
  "referralCode": "WELCOME25",
  "otp": "123456"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Kayıt başarılı! Hoş geldiniz.",
  "data": {
    "customer": {
      "id": 1,
      "email": "ahmet@example.com",
      "fullName": "Ahmet Yılmaz",
      "phone": "05551234567"
    },
    "token": "signed_bearer_token"
  }
}
```

### 4. Giriş yap

`POST /api/customer/login`

İstek:

```json
{
  "phone": "05551234567",
  "otp": "123456"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Giriş başarılı!",
  "data": {
    "customer": {
      "id": 1,
      "email": "ahmet@example.com",
      "fullName": "Ahmet Yılmaz",
      "phone": "05551234567"
    },
    "token": "signed_bearer_token"
  }
}
```

### 5. Temizlik endpoint'i

`DELETE /api/otp/cleanup`

Bu uç:

- süresi dolmuş OTP kayıtlarını
- 7 günden eski doğrulanmış kayıtları

temizler.

## Güvenlik Notları

- OTP kodu 6 hanelidir.
- OTP süresi 10 dakikadır.
- Kod tek kullanımlıktır.
- Production ortamında OTP kodu yanıt gövdesine dönmez.
- Müşteri oturumu için dönen token Bearer olarak kullanılmalıdır.

## Sorun Giderme

### SMS gitmiyor

- `SMS_*` bilgilerini kontrol edin.
- `SMS_ORIGINATOR` Asist tarafında tanımlı olmalı.
- Sunucu IP adresi Asist tarafında yetkili olmalı.
- `NODE_ENV=development` ise gerçek SMS gönderilmez; bu beklenen davranıştır.

### OTP doğrulanmıyor

- `purpose` değeri aynı kalmalı.
- Kod süresi dolmuş olabilir.
- Kod daha önce kullanılmış olabilir.

### Register veya login token dönmüyor

- `server/routes/customer-auth.js` akışını kontrol edin.
- Production ortamında `AUTH_TOKEN_SECRET` eksikse uygulama başlamaz.

## İlgili Dosyalar

- `server/routes/otp.js`
- `server/routes/customer-auth.js`
- `server/config/sms.js`
- `server/services/auth-token.js`
