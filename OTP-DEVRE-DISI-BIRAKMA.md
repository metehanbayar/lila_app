# OTP Sistemini Devre Dışı Bırakma

Bu dokümantasyon, OTP (One-Time Password) sistemini geçici olarak devre dışı bırakmanız için gereken adımları açıklar.

## Nasıl Devre Dışı Bırakılır?

### 1. `.env` Dosyasını Düzenleyin

`server/.env` dosyanızı açın ve aşağıdaki satırı ekleyin veya güncelleyin:

```env
OTP_ENABLED=false
```

### 2. Sunucuyu Yeniden Başlatın

Değişikliğin etkili olması için Node.js sunucunuzu yeniden başlatın:

```bash
# server klasöründe
npm run dev
# veya
node server.js
```

## OTP Devre Dışıyken Nasıl Çalışır?

### Kayıt İşlemi
- Kullanıcı telefon numarası girdiğinde OTP gönderme isteği yapılır
- Sistem demo modda çalışır ve `123456` kodunu döner
- Kullanıcı herhangi bir kod girdiğinde kabul edilir
- Kayıt işlemi normal şekilde tamamlanır

### Giriş İşlemi
- Kullanıcı telefon numarası girdiğinde OTP gönderme isteği yapılır
- Sistem demo modda çalışır ve `123456` kodunu döner
- Kullanıcı herhangi bir kod girdiğinde kabul edilir
- Giriş işlemi normal şekilde tamamlanır

## Console Çıktıları

OTP devre dışıyken, sunucu konsolunda aşağıdaki uyarıları göreceksiniz:

```
⚠️ OTP DEVRE DIŞI - Demo mod aktif
⚠️ OTP DEVRE DIŞI - Demo mod aktif - Her kod geçerli
⚠️ OTP DEVRE DIŞI - Kayıt işlemi OTP olmadan devam ediyor
⚠️ OTP DEVRE DIŞI - Giriş işlemi OTP olmadan devam ediyor
```

## Nasıl Tekrar Açılır?

OTP sistemini tekrar aktif etmek için:

### 1. `.env` Dosyasını Düzenleyin

```env
OTP_ENABLED=true
```

veya satırı tamamen kaldırın (varsayılan olarak aktiftir).

### 2. Sunucuyu Yeniden Başlatın

```bash
# server klasöründe
npm run dev
# veya
node server.js
```

## Güvenlik Uyarısı

⚠️ **ÖNEMLİ**: OTP sistemini devre dışı bırakmak, güvenlik açığı oluşturur. Bu özelliği sadece:

- Geliştirme ortamında
- Test amaçlı
- Geçici olarak

kullanın. **Asla production ortamında OTP'yi devre dışı bırakmayın!**

## Sorun Giderme

### Değişiklik Etkili Olmuyor
- Sunucuyu tamamen durdurup yeniden başlattığınızdan emin olun
- `.env` dosyasının doğru konumda olduğunu kontrol edin (`server/.env`)
- `.env` dosyasında `OTP_ENABLED=false` satırının doğru yazıldığından emin olun

### SMS Hala Gönderiliyor
- OTP devre dışıyken SMS gönderilmez
- Eğer hala SMS gönderiliyorsa, `OTP_ENABLED` değişkenini kontrol edin
- Sunucu loglarında "OTP DEVRE DIŞI" mesajını görmüyorsanız, ayar yüklenmemiştir

## Teknik Detaylar

Sistem aşağıdaki dosyalarda değiştirildi:
- `server/routes/otp.js` - OTP gönderme ve doğrulama
- `server/routes/customer-auth.js` - Müşteri kayıt ve giriş

`isOTPEnabled()` fonksiyonu `process.env.OTP_ENABLED` değişkenini kontrol eder ve `false` ise OTP kontrollerini bypass eder.

