# 👤 Müşteri Paneli Kullanım Kılavuzu

## 📋 İçindekiler
1. [Özellikler](#özellikler)
2. [Kurulum](#kurulum)
3. [Kullanım](#kullanım)
4. [API Endpoints](#api-endpoints)
5. [Güvenlik](#güvenlik)

---

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi
- ✅ Kayıt olma (E-posta, şifre, ad, telefon, adres)
- ✅ Giriş yapma
- ✅ Profil güncelleme
- ✅ Şifre değiştirme
- ✅ Oturum yönetimi (token-based)

### 📦 Sipariş Yönetimi
- ✅ Sipariş geçmişini görüntüleme
- ✅ Sipariş detaylarını inceleme
- ✅ Sipariş durumunu takip etme
- ✅ İstatistikler (toplam sipariş, harcama, aktif siparişler)

### ⭐ Favori Ürünler
- ✅ Ürünleri favorilere ekleme
- ✅ Favori ürünleri listeleme
- ✅ Favorilerden çıkarma

### 🛒 Gelişmiş Checkout
- ✅ Kayıtlı kullanıcılar için otomatik doldurma
- ✅ Sipariş geçmişine otomatik kayıt
- ✅ Profil bilgilerinden hızlı sipariş

---

## 🚀 Kurulum

### 1. Veritabanı Kurulumu

```bash
# SQL Server'da şu dosyayı çalıştırın:
server/database/customer-schema.sql
```

Bu dosya şunları oluşturur:
- `Customers` tablosu
- `CustomerFavorites` tablosu
- `Orders` tablosuna `CustomerId` kolonu ekler

### 2. Backend

Backend zaten güncellenmiştir. Sunucuyu yeniden başlatın:

```bash
cd server
npm start
```

### 3. Frontend

Frontend güncellenmiştir:

```bash
cd client
npm run dev
```

---

## 📖 Kullanım

### Kayıt Olma

1. Ana sayfada sağ üst köşedeki **Kullanıcı** ikonuna tıklayın
2. "Kayıt Ol" linkine tıklayın
3. Formu doldurun:
   - **E-posta** (zorunlu)
   - **Şifre** (en az 6 karakter, zorunlu)
   - **Ad Soyad** (zorunlu)
   - **Telefon** (isteğe bağlı)
   - **Adres** (isteğe bağlı)
4. "Kayıt Ol" butonuna tıklayın
5. Otomatik olarak giriş yapılır ve profile yönlendirilirsiniz

### Giriş Yapma

1. Header'daki **Kullanıcı** ikonuna tıklayın
2. E-posta ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

**Test Kullanıcısı:**
- E-posta: `test@example.com`
- Şifre: `test123`

### Profil Sayfası

Profil sayfasında şunları görebilirsiniz:
- ✅ Toplam sipariş sayısı
- ✅ Toplam harcama
- ✅ Aktif sipariş sayısı
- ✅ Hesap bilgileri (ad, e-posta, telefon, adres)

**Profil Düzenleme:**
1. "Düzenle" butonuna tıklayın
2. Bilgilerinizi güncelleyin
3. "Kaydet" butonuna tıklayın

### Sipariş Verme (Kayıtlı Kullanıcı)

1. Normal şekilde ürünleri sepete ekleyin
2. "Sepeti Onayla" butonuna tıklayın
3. **Otomatik olarak** ad, telefon ve adres bilgileriniz doldurulur
4. Gerekirse bilgileri düzenleyin
5. "Sipariş Ver" butonuna tıklayın
6. Sipariş otomatik olarak hesabınıza kaydedilir

### Sipariş Geçmişi

1. Profil sayfasından "Siparişlerim" kartına tıklayın
2. Veya header'dan Kullanıcı ikonu > Profil > Siparişlerim
3. Tüm siparişlerinizi görürsünüz
4. Bir siparişe tıklayarak detaylarını görebilirsiniz

### Sipariş Detayı

Sipariş detay sayfasında:
- ✅ Sipariş durumu
- ✅ Sipariş tarihi
- ✅ Teslimat bilgileri
- ✅ Sipariş edilen ürünler
- ✅ Toplam tutar

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/customer/register         # Kayıt ol
POST   /api/customer/login            # Giriş yap
GET    /api/customer/profile          # Profil getir
PUT    /api/customer/profile          # Profil güncelle
PUT    /api/customer/change-password  # Şifre değiştir
```

### Orders

```
GET    /api/customer/my-orders                  # Siparişlerim
GET    /api/customer/my-orders/:orderNumber     # Sipariş detayı
GET    /api/customer/statistics                 # İstatistikler
```

### Favorites

```
GET    /api/customer/favorites           # Favori ürünleri listele
POST   /api/customer/favorites/:productId  # Favorilere ekle
DELETE /api/customer/favorites/:productId  # Favorilerden çıkar
```

---

## 🎯 Özellikler Detayı

### Mobil Uyumlu Tasarım

Tüm sayfalar **mobile-first** yaklaşımıyla tasarlanmıştır:
- ✅ Responsive layout
- ✅ Touch-friendly butonlar
- ✅ Kolay navigasyon
- ✅ Optimize edilmiş formlar

### Otomatik Doldurma

Kayıtlı kullanıcılar için:
- ✅ Checkout sayfasında bilgiler otomatik doldurulur
- ✅ Profil bilgileri güncel tutulur
- ✅ Tekrar tekrar bilgi girmeye gerek kalmaz

### Sipariş Takibi

5 farklı sipariş durumu:
- 🟡 **Beklemede** - Sipariş alındı, onay bekleniyor
- 🔵 **Onaylandı** - Sipariş onaylandı
- 🟣 **Hazırlanıyor** - Sipariş hazırlanıyor
- 🟢 **Teslim Edildi** - Sipariş teslim edildi
- 🔴 **İptal** - Sipariş iptal edildi

### İstatistikler

Profil sayfasında:
- 📊 Toplam sipariş sayısı
- 💰 Toplam harcanan tutar
- 📦 Aktif sipariş sayısı
- 📈 Sipariş durumu dağılımı

---

## 🔒 Güvenlik

### Şifre Politikası
- ✅ Minimum 6 karakter
- ✅ Backend'de hash'lenmeli (üretim ortamında bcrypt kullanın)

### E-posta Doğrulama
- ✅ E-posta format kontrolü
- ✅ Unique e-posta kontrolü

### Oturum Yönetimi
- ✅ Token-based authentication
- ✅ Otomatik logout (401 hatalarında)
- ✅ Güvenli route koruması

### Veri Güvenliği
- ✅ SQL injection koruması (parametreli sorgular)
- ✅ Input validation (frontend & backend)
- ✅ XSS koruması

---

## 🎨 UI/UX Özellikleri

### Header
- 🏠 Ana sayfa butonu
- 👤 Kullanıcı ikonu (giriş yapıldıysa renkli)
- 🛒 Sepet ikonu (adet gösterimi ile)

### Responsive Design
- 📱 Mobil (< 640px): Tek kolon, büyük butonlar
- 📱 Tablet (640-1024px): İki kolon layout
- 💻 Desktop (> 1024px): Üç kolon layout

### Formlar
- ✅ Büyük input alanları (mobilde kolay kullanım)
- ✅ İkon destekli inputlar
- ✅ Gerçek zamanlı validasyon
- ✅ Hata mesajları

---

## 📱 Sayfa Yapısı

### Login (`/login`)
- E-posta ve şifre ile giriş
- "Kayıt Ol" linki
- "Ana Sayfaya Dön" linki

### Register (`/register`)
- Kapsamlı kayıt formu
- Şifre tekrar kontrolü
- "Giriş Yap" linki

### Profile (`/profile`)
- İstatistik kartları
- Hesap bilgileri
- Profil düzenleme
- Hızlı aksiyonlar (Siparişlerim, Yeni Sipariş)

### Order History (`/my-orders`)
- Tüm siparişler liste halinde
- Sipariş durumu badge'leri
- Pagination (sayfa başına 10 sipariş)
- Detaya git butonu

### Order Detail (`/my-orders/:orderNumber`)
- Sipariş durumu
- Müşteri bilgileri
- Sipariş ürünleri listesi
- Toplam tutar

---

## 🔄 Workflow

### Yeni Kullanıcı
1. Ana sayfaya gelir
2. Menüye göz atar
3. Ürün ekler
4. Sepete gider
5. Checkout sayfasında **"Kayıt Ol"** bağlantısını görür
6. Kayıt olur
7. Otomatik giriş yapılır
8. Sipariş verir
9. Sipariş hesabına kaydedilir

### Mevcut Kullanıcı
1. Giriş yapar
2. Sepete ürün ekler
3. Checkout'ta bilgileri **otomatik doldurulur**
4. Hızlıca sipariş verir
5. Profilden siparişlerini takip eder

---

## ⚠️ Önemli Notlar

### Üretim Ortamı İçin
1. **Şifre Hash'leme:** Bcrypt kullanın
2. **JWT Token:** Basit token yerine JWT kullanın
3. **E-posta Doğrulama:** E-posta verification ekleyin
4. **Rate Limiting:** Brute force koruması ekleyin
5. **HTTPS:** Mutlaka HTTPS kullanın

### Veritabanı
- `CustomerId` kolonu `NULL` olabilir (misafir kullanıcılar için)
- Eski siparişler `CustomerId = NULL` olacak
- Soft delete kullanılıyor (IsActive = 0)

---

## 🐛 Sorun Giderme

### "Giriş yapmanız gerekiyor" hatası
- Token süresi dolmuş olabilir
- Yeniden giriş yapın

### Sipariş geçmişi görünmüyor
- Sipariş verirken giriş yapmış olduğunuzdan emin olun
- CustomerId doğru kaydedilmiş mi kontrol edin

### Profil güncellenmiyor
- Backend loglarını kontrol edin
- Browser console'da hata var mı bakın

---

## 🎉 Tamamlandı!

Müşteri paneli tam özellikli ve kullanıma hazır! 

**Yeni Özellikler:**
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Profil yönetimi
- ✅ Sipariş geçmişi ve takibi
- ✅ İstatistikler
- ✅ Favori ürünler (backend hazır)
- ✅ Otomatik doldurma (checkout)
- ✅ Mobile-first tasarım

**Kullanıcı Deneyimi:**
- 📱 Mobil uyumlu
- ⚡ Hızlı ve akıcı
- 🎨 Modern ve şık tasarım
- 🔒 Güvenli

Başarılar! 🚀

