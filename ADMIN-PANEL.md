# 🔐 Admin Panel Kullanım Kılavuzu

## 📋 İçindekiler
1. [Kurulum](#kurulum)
2. [Giriş Bilgileri](#giriş-bilgileri)
3. [Özellikler](#özellikler)
4. [Kullanım](#kullanım)
5. [API Endpoints](#api-endpoints)

---

## 🚀 Kurulum

### 1. Veritabanı Kurulumu

Admin kullanıcıları için veritabanına tablo eklemeniz gerekiyor:

```bash
# SQL Server'da şu dosyayı çalıştırın:
server/database/admin-schema.sql
```

Bu, `AdminUsers` tablosunu oluşturacak ve varsayılan admin kullanıcısını ekleyecektir.

### 2. Backend Kurulumu

Backend zaten güncellenmiştir. Sunucuyu yeniden başlatmanız yeterli:

```bash
cd server
npm start
```

### 3. Frontend Kurulumu

Frontend da güncellenmiştir. Client'ı başlatın:

```bash
cd client
npm run dev
```

---

## 🔑 Giriş Bilgileri

**Varsayılan Admin Kullanıcısı:**
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

⚠️ **ÖNEMLİ:** Gerçek üretim ortamında mutlaka bu şifreyi değiştirin!

**Admin Panel URL:**
```
http://localhost:5173/admin/login
```

---

## ✨ Özellikler

### 📊 Dashboard
- Toplam restoran, ürün ve sipariş sayıları
- Bugünkü sipariş ve ciro istatistikleri
- Son siparişlerin listesi
- Sipariş durumu dağılımı

### 🏪 Restoran Yönetimi
- Restoran ekleme, düzenleme, silme
- Restoran bilgileri:
  - İsim
  - Slug (URL)
  - Açıklama
  - Tema rengi
  - Aktif/Pasif durumu

### 📂 Kategori Yönetimi
- Kategori ekleme, düzenleme, silme
- Restorana özel kategoriler
- Sıralama düzeni
- Aktif/Pasif durumu

### 📦 Ürün Yönetimi
- Ürün ekleme, düzenleme, silme
- Ürün bilgileri:
  - İsim
  - Açıklama
  - Fiyat
  - Görsel URL
  - Restoran ve kategori seçimi
  - Öne çıkan ürün işaretleme
  - Sıralama
  - Aktif/Pasif durumu

### 🛍️ Sipariş Yönetimi
- Tüm siparişleri görüntüleme
- Sipariş detaylarını inceleme
- Sipariş durumu güncelleme:
  - Beklemede (Pending)
  - Onaylandı (Confirmed)
  - Hazırlanıyor (Preparing)
  - Teslim Edildi (Delivered)
  - İptal (Cancelled)
- Duruma göre filtreleme
- Sayfalama (pagination)

---

## 📖 Kullanım

### Admin Panel'e Giriş

1. Tarayıcınızda `/admin/login` adresine gidin
2. Kullanıcı adı ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın

### Yeni Restoran Ekleme

1. Sol menüden "Restoranlar" seçin
2. Sağ üstteki "Yeni Restoran" butonuna tıklayın
3. Formu doldurun:
   - Restoran Adı (zorunlu)
   - Slug - URL dostu isim (zorunlu)
   - Açıklama
   - Tema rengi
   - Aktif durumu
4. "Kaydet" butonuna tıklayın

### Yeni Kategori Ekleme

1. Sol menüden "Kategoriler" seçin
2. "Yeni Kategori" butonuna tıklayın
3. Restoran seçin
4. Kategori adını girin
5. Sıralama numarası belirleyin (isteğe bağlı)
6. "Kaydet" butonuna tıklayın

### Yeni Ürün Ekleme

1. Sol menüden "Ürünler" seçin
2. "Yeni Ürün" butonuna tıklayın
3. Formu doldurun:
   - Restoran (zorunlu)
   - Kategori (isteğe bağlı)
   - Ürün adı (zorunlu)
   - Açıklama
   - Fiyat (zorunlu)
   - Görsel URL
   - Öne çıkan ürün mü?
   - Sıralama
   - Aktif durumu
4. "Kaydet" butonuna tıklayın

### Sipariş Durumu Güncelleme

1. Sol menüden "Siparişler" seçin
2. Bir siparişin yanındaki "Detay" butonuna tıklayın
3. "Sipariş Durumu" açılır menüsünden yeni durumu seçin
4. Durum otomatik olarak güncellenecektir

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/admin/login
```

### Dashboard
```
GET    /api/admin/dashboard/stats
GET    /api/admin/dashboard/recent-orders
```

### Restaurants
```
GET    /api/admin/restaurants
GET    /api/admin/restaurants/:id
POST   /api/admin/restaurants
PUT    /api/admin/restaurants/:id
DELETE /api/admin/restaurants/:id
```

### Categories
```
GET    /api/admin/categories
GET    /api/admin/categories/:id
GET    /api/admin/categories/restaurant/:restaurantId
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

### Products
```
GET    /api/admin/products
GET    /api/admin/products/:id
GET    /api/admin/products/restaurant/:restaurantId
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
```

### Orders
```
GET    /api/admin/orders?status=&page=&limit=
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status
PATCH  /api/admin/orders/:id/notes
DELETE /api/admin/orders/:id
```

---

## 🔒 Güvenlik Notları

1. **Şifre Değiştirme:** Varsayılan admin şifresini mutlaka değiştirin
2. **HTTPS:** Üretim ortamında mutlaka HTTPS kullanın
3. **JWT Token:** Mevcut basit token sistemi geliştirme içindir. Üretimde JWT kullanın
4. **Rate Limiting:** API'de rate limiting aktiftir (15 dakikada max 100 istek)
5. **SQL Injection:** Tüm sorgular parametreli olarak hazırlanmıştır

---

## 🎨 Özelleştirme

### Tema Renkleri

Admin paneli, projenizin mevcut Tailwind renk paletini kullanır:
- **Primary:** #EC4899 (Fusya)
- **Secondary:** #22C55E (Yeşil)
- **Dark:** #1F2937 (Koyu Gri)

Renkleri değiştirmek için `client/tailwind.config.js` dosyasını düzenleyin.

### Sayfalama Ayarları

Sipariş listesinde varsayılan sayfa başına 20 kayıt gösterilir. Bunu değiştirmek için:

`client/src/pages/admin/Orders.jsx` dosyasında:
```javascript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20, // Bu değeri değiştirin
  total: 0,
  totalPages: 0,
});
```

---

## 🐛 Sorun Giderme

### "Yetkilendirme hatası" alıyorum
- Giriş yapmış olduğunuzdan emin olun
- Token'ın süresi dolmuş olabilir, yeniden giriş yapın
- Browser console'da hata mesajlarını kontrol edin

### "Veritabanı bağlantı hatası"
- SQL Server'ın çalıştığından emin olun
- `server/.env` dosyasındaki bağlantı bilgilerini kontrol edin
- `server/database/admin-schema.sql` dosyasının çalıştırıldığından emin olun

### Değişiklikler görünmüyor
- Sayfayı yenileyin (F5)
- Browser cache'ini temizleyin
- Backend ve frontend'in çalıştığından emin olun

---

## 📞 Destek

Sorun yaşarsanız veya öneriniz varsa:
1. Backend loglarını kontrol edin: `server` klasöründe konsol çıktıları
2. Frontend loglarını kontrol edin: Browser Developer Tools > Console
3. Database loglarını kontrol edin: SQL Server Management Studio

---

## 🎉 Tamamlandı!

Admin paneliniz kullanıma hazır! Başarılar! 🚀

