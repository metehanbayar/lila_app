# OTP SMS Doğrulama Sistemi Kurulum Rehberi

Bu dokümantasyon, sistemdeki OTP (One-Time Password) SMS doğrulama sisteminin kurulumu ve kullanımını açıklamaktadır.

## 📋 İçindekiler

1. [Özellikler](#özellikler)
2. [Veritabanı Kurulumu](#veritabanı-kurulumu)
3. [SMS Servisi Konfigürasyonu](#sms-servisi-konfigürasyonu)
4. [Kullanım](#kullanım)
5. [Geliştirme Modu](#geliştirme-modu)
6. [API Endpoints](#api-endpoints)

## ✨ Özellikler

- ✅ Telefon numarası ile kayıt olma
- ✅ Telefon numarası ile giriş yapma (şifresiz)
- ✅ 6 haneli OTP kodu
- ✅ SMS ile kod gönderimi (NetGSM entegrasyonu)
- ✅ 10 dakika geçerlilik süresi
- ✅ 5 dakika içinde tekrar gönderim engeli
- ✅ Geliştirme modu desteği
- ✅ Otomatik kod temizleme

## 🗄️ Veritabanı Kurulumu

### 1. Migration Çalıştırma

```bash
# SQL Server Management Studio'da aşağıdaki dosyayı çalıştırın:
server/database/migrations/add-otp-verification.sql
```

Migration dosyası şunları yapar:
- `OTPVerification` tablosunu oluşturur
- `Customers` tablosuna `PhoneVerified` alanını ekler
- Gerekli indeksleri oluşturur

### 2. Tablo Yapısı

**OTPVerification Tablosu:**
```sql
- Id (INT, PRIMARY KEY)
- Phone (NVARCHAR(20)) - Telefon numarası
- OTPCode (NVARCHAR(6)) - 6 haneli kod
- Purpose (NVARCHAR(50)) - 'register' veya 'login'
- IsVerified (BIT) - Doğrulandı mı?
- ExpiresAt (DATETIME) - Geçerlilik süresi
- CreatedAt (DATETIME) - Oluşturulma tarihi
- VerifiedAt (DATETIME) - Doğrulanma tarihi
```

## 📱 SMS Servisi Konfigürasyonu

### Asist SMS Hesap Kurulumu

1. **Asist SMS Hesabı Oluşturun:**
   - https://www.asistiletisim.com.tr adresinden hesap açın
   - SMS paketi satın alın

2. **API Bilgilerini Alın:**
   - Kullanıcı adı (Username)
   - Şifre (Password)
   - Kullanıcı Kodu (UserCode)
   - Hesap ID (AccountId)
   - Başlık (Originator) - Örn: "LILAGSTO"

3. **Web Service Bilgileri:**
   - WSDL URL: https://webservice.asistiletisim.com.tr/smsproxy.asmx?wsdl
   - SOAP tabanlı web servisi
   - Dokümantasyon: https://dosya.asistbt.com.tr/smsproxywebservice.pdf

4. **.env Dosyasını Yapılandırın:**

```env
# SMS Configuration (Asist SMS)
SMS_USERNAME=your_asist_username
SMS_PASSWORD=your_asist_password
SMS_USERCODE=your_usercode
SMS_ACCOUNTID=your_accountid
SMS_ORIGINATOR=LILAGSTO
```

### Alternatif SMS Servisleri

Başka SMS servisleri kullanmak için `server/config/sms.js` dosyasını düzenleyin:
- NetGSM
- Twilio
- Vonage (Nexmo)
- İletimerkezi
- Mobildev

## 🚀 Kullanım

### Kayıt Olma Akışı

1. Kullanıcı telefon numarası ve ad soyad girer
2. Sistem OTP kodu oluşturur ve SMS gönderir
3. Kullanıcı 6 haneli kodu girer
4. Kod doğrulanır
5. Hesap oluşturulur ve otomatik giriş yapılır

### Giriş Yapma Akışı

1. Kullanıcı telefon numarası girer
2. Sistem OTP kodu oluşturur ve SMS gönderir
3. Kullanıcı 6 haneli kodu girer
4. Kod doğrulanır
5. Giriş yapılır

## 🔧 Geliştirme Modu

Geliştirme ortamında SMS göndermek yerine konsola yazdırılır ve OTP kodu API yanıtında döner.

### Geliştirme Modunu Aktifleştirme

```env
NODE_ENV=development
```

veya SMS bilgilerini boş bırakın:
```env
SMS_USERNAME=
SMS_PASSWORD=
```

### Konsol Çıktısı Örneği:

```
📱 SMS (DEV MODE):
To: 05551234567
Message: Lila Gusto giris kodunuz: 123456
Bu kodu kimseyle paylasmayiniz.
---
```

## 📡 API Endpoints

### 1. OTP Gönder

**POST** `/api/otp/send`

**Request Body:**
```json
{
  "phone": "05551234567",
  "purpose": "login" // veya "register"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Doğrulama kodu telefonunuza gönderildi",
  "otp": "123456" // Sadece development modunda
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Lütfen 45 saniye sonra tekrar deneyin",
  "waitTime": 45
}
```

### 2. OTP Doğrula

**POST** `/api/otp/verify`

**Request Body:**
```json
{
  "phone": "05551234567",
  "otp": "123456",
  "purpose": "login" // veya "register"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doğrulama başarılı"
}
```

### 3. Kayıt Ol (OTP ile)

**POST** `/api/customer/register`

**Request Body:**
```json
{
  "phone": "05551234567",
  "fullName": "Ahmet Yılmaz",
  "email": "ahmet@example.com", // Opsiyonel
  "address": "İstanbul", // Opsiyonel
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kayıt başarılı! Hoş geldiniz.",
  "data": {
    "customer": {
      "id": 1,
      "email": "ahmet@example.com",
      "fullName": "Ahmet Yılmaz",
      "phone": "05551234567",
      "address": "İstanbul"
    },
    "token": "base64_encoded_token"
  }
}
```

### 4. Giriş Yap (OTP ile)

**POST** `/api/customer/login`

**Request Body:**
```json
{
  "phone": "05551234567",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Giriş başarılı!",
  "data": {
    "customer": {
      "id": 1,
      "email": "ahmet@example.com",
      "fullName": "Ahmet Yılmaz",
      "phone": "05551234567",
      "address": "İstanbul",
      "phoneVerified": true
    },
    "token": "base64_encoded_token"
  }
}
```

### 5. OTP Temizleme (Bakım)

**DELETE** `/api/otp/cleanup`

Süresi dolmuş veya 7 günden eski doğrulanmış OTP'leri temizler.

**Response:**
```json
{
  "success": true,
  "message": "15 kayıt temizlendi"
}
```

## 🔒 Güvenlik

### Rate Limiting
- Aynı telefon için 5 dakika içinde sadece 1 OTP gönderilebilir
- API rate limiting aktif (production modunda)

### OTP Özellikleri
- 6 haneli rastgele kod
- 10 dakika geçerlilik süresi
- Tek kullanımlık (IsVerified kontrolü)
- Şifreli olmayan connection'larda hash'lenmeli (gelecek geliştirme)

### Telefon Numarası Validasyonu
- Türkiye formatı: `05XXXXXXXXX` veya `5XXXXXXXXX`
- Otomatik temizleme (boşluk ve tire kaldırma)
- Uluslararası format desteği (90 ön eki)

## 🛠️ Bakım ve İzleme

### Otomatik Temizleme (Önerilen)

Cron job veya scheduled task ile günlük temizleme:

```bash
# Linux/Mac crontab
0 2 * * * curl -X DELETE http://localhost:3000/api/otp/cleanup

# Windows Task Scheduler
curl -X DELETE http://localhost:3000/api/otp/cleanup
```

### Loglama

SMS gönderimi ve OTP doğrulaması loglanır:
```
✅ SMS gönderildi: 05551234567 - Mesaj ID: 001234567
❌ SMS gönderme hatası: Kod 30
```

## 🐛 Sorun Giderme

### SMS Gönderilmiyor
1. Asist SMS kredisi kontrol edin
2. API bilgilerini doğrulayın (.env dosyası):
   - Username, Password, UserCode, AccountId doğru mu?
3. Originator (başlık) Asist'te tanımlı mı kontrol edin
4. IP adresiniz Asist'e tanımlı mı kontrol edin (Hata kodu: -22)
5. Telefon numarası formatını kontrol edin (90XXXXXXXXXX)

### OTP Doğrulanmıyor
1. Kodun süresinin dolmadığından emin olun (10 dakika)
2. Kod daha önce kullanılmamış olmalı (IsVerified = 0)
3. Purpose değeri tutmalı ('login' veya 'register')

### Geliştirme Modunda Çalışmıyor
1. `NODE_ENV=development` olduğundan emin olun
2. Konsol loglarını kontrol edin
3. API yanıtında `otp` alanını görüyor musunuz?

## 📝 Notlar

- Production ortamında mutlaka gerçek SMS servisi kullanın
- OTP kodlarını asla loglamayın (production'da)
- Telefon numaralarını hash'leyerek saklama düşünülebilir
- JWT token sistemi entegre edilebilir
- 2FA (Two-Factor Authentication) olarak genişletilebilir

## 🔄 Gelecek Geliştirmeler

- [ ] JWT token entegrasyonu
- [ ] Biometric authentication desteği
- [ ] Email OTP alternatifi
- [ ] WhatsApp OTP entegrasyonu
- [ ] OTP kod hash'leme
- [ ] Brute force koruması
- [ ] IP bazlı rate limiting
- [ ] Çoklu SMS sağlayıcı desteği (fallback)

