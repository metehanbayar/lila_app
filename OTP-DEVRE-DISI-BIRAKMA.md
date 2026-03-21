# OTP Sistemini Devre Dışı Bırakma

Bu seçenek sadece geliştirme ve test içindir.

## Nasıl Kapatılır

`server/.env` içinde:

```env
OTP_ENABLED=false
```

sonra server'ı yeniden başlatın:

```bash
cd server
npm run dev
```

## Kapanınca Ne Olur

- `POST /api/otp/send` demo mod yanıtı döner
- demo yanıtta `otp: "123456"` görünür
- `POST /api/otp/verify` doğrulamayı başarılı kabul eder
- müşteri kayıt ve giriş akışı OTP bariyerini development amaçlı bypass edebilir

## Güvenlik Uyarısı

Production ortamında kullanılmamalıdır.

## İlgili Dosyalar

- `server/routes/otp.js`
- `server/routes/customer-auth.js`
