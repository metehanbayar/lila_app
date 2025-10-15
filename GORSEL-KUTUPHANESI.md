# Görsel Kütüphanesi Sistemi

## 📸 Genel Bakış

Lila Group Menu artık profesyonel bir görsel kütüphanesi sistemi ile geliyor! Artık tüm görselleri admin panelinden kolayca yükleyebilir, yönetebilir ve restoranlar ile ürünlerde kullanabilirsiniz.

## ✨ Özellikler

- **Dosya Yükleme**: Görselleri sürükle-bırak veya dosya seçici ile yükleyin
- **Görsel Kütüphanesi**: Tüm yüklediğiniz görselleri tek yerden görüntüleyin ve yönetin
- **Akıllı Seçici**: Restoran ve ürün formlarında görselleri kolayca seçin
- **Anlık Önizleme**: Görselleri yüklemeden önce ve sonra önizleyin
- **Arama**: Görsel kütüphanesinde arama yapın
- **Güvenli Depolama**: Görseller sunucuda güvenli bir şekilde saklanır
- **URL Kopyalama**: Görsel URL'lerini kolayca kopyalayın
- **Dosya Yönetimi**: İstenmeyen görselleri silin

## 🚀 Kurulum

### 1. Veritabanı Kurulumu

SQL Server'da `Media` tablosunu oluşturun:

```sql
-- server/database/migrations/add-media-table.sql dosyasını çalıştırın
```

Veya yeni bir kurulum yapıyorsanız, güncellenmiş `schema.sql` dosyasını kullanın.

### 2. Sunucu Klasörü

Sunucu başlatıldığında `server/uploads/` klasörü otomatik olarak oluşturulacaktır. Manuel olarak oluşturmak isterseniz:

```bash
cd server
mkdir uploads
```

### 3. Paketler

Gerekli tüm paketler zaten `package.json` dosyasında mevcut:

- `multer`: Dosya yükleme
- `express`: Web sunucusu
- `mssql`: Veritabanı bağlantısı

### 4. Sunucuyu Başlatın

```bash
cd server
npm run dev
```

## 📖 Kullanım

### Admin Paneli - Görsel Kütüphanesi

1. Admin paneline giriş yapın
2. Sol menüden **"Görsel Kütüphanesi"** seçeneğine tıklayın
3. **"Görsel Yükle"** butonuna tıklayın
4. Bir veya birden fazla görsel seçin (Maks. 5MB)
5. Yüklenen görseller otomatik olarak kütüphanede görünecektir

### Restoranlar ve Ürünlerde Görsel Kullanımı

#### Restoran Ekleme/Düzenleme:
1. **Restoranlar** sayfasına gidin
2. "Yeni Restoran" veya düzenle butonuna tıklayın
3. **"Restoran Görseli"** bölümünde:
   - "Görsel Seç" butonuna tıklayın
   - Açılan pencerede:
     - **Görsel Kütüphanesi** sekmesinden mevcut bir görseli seçin
     - veya **Yeni Yükle** sekmesinden yeni bir görsel yükleyin
4. Görseli seçtikten sonra otomatik olarak forma eklenecektir

#### Ürün Ekleme/Düzenleme:
1. **Ürünler** sayfasına gidin
2. "Yeni Ürün" veya düzenle butonuna tıklayın
3. **"Ürün Görseli"** bölümünde aynı işlemleri yapın

### Görsel Yönetimi

#### Görsel URL'i Kopyalama:
- Görsel kütüphanesinde bir görselin üzerinde **"URL Kopyala"** butonuna tıklayın
- URL otomatik olarak kopyalanacaktır

#### Görsel Silme:
- Görsel kütüphanesinde veya seçici modalda görselin üzerinde **çöp kutusu** ikonuna tıklayın
- Onay verdikten sonra görsel hem veritabanından hem de sunucudan silinecektir

## 🔧 Teknik Detaylar

### Backend API Endpoint'leri

```
GET    /api/admin/media                 - Tüm görselleri listele
GET    /api/admin/media/:id             - Tek görsel detayı
POST   /api/admin/media/upload          - Tek görsel yükle
POST   /api/admin/media/upload-multiple - Çoklu görsel yükle
DELETE /api/admin/media/:id             - Görsel sil
```

### Dosya Yapısı

```
server/
  ├── config/
  │   └── multer.js              # Multer konfigürasyonu
  ├── routes/
  │   └── admin-media.js         # Media API route'ları
  ├── uploads/                   # Yüklenen görseller
  └── database/
      └── migrations/
          └── add-media-table.sql # Media tablosu migration

client/
  ├── src/
  │   ├── components/
  │   │   └── admin/
  │   │       └── ImagePicker.jsx # Görsel seçici component
  │   ├── pages/
  │   │   └── admin/
  │   │       └── Media.jsx       # Görsel kütüphanesi sayfası
  │   └── services/
  │       └── adminApi.js         # Media API fonksiyonları
```

### Veritabanı Tablosu

```sql
CREATE TABLE Media (
    Id INT PRIMARY KEY IDENTITY(1,1),
    FileName NVARCHAR(255) NOT NULL,        -- Sunucudaki dosya adı
    OriginalName NVARCHAR(255) NOT NULL,    -- Orijinal dosya adı
    FilePath NVARCHAR(500) NOT NULL,        -- Sunucudaki tam yol
    FileUrl NVARCHAR(500) NOT NULL,         -- Web URL'i (/uploads/...)
    FileSize INT NOT NULL,                  -- Dosya boyutu (bytes)
    MimeType NVARCHAR(100) NOT NULL,        -- Dosya tipi (image/jpeg vb.)
    Width INT NULL,                         -- Görsel genişliği
    Height INT NULL,                        -- Görsel yüksekliği
    UploadedBy NVARCHAR(100) NULL,          -- Yükleyen kullanıcı
    CreatedAt DATETIME DEFAULT GETDATE()    -- Yüklenme tarihi
);
```

### Güvenlik

- **Dosya Tipi Kontrolü**: Sadece resim dosyaları kabul edilir (JPEG, PNG, GIF, WebP)
- **Boyut Limiti**: Maksimum 5MB dosya boyutu
- **Benzersiz Dosya Adları**: Her dosya benzersiz bir isimle kaydedilir
- **Admin Yetkisi**: Tüm işlemler admin authentication gerektirir

### Desteklenen Formatlar

- JPEG / JPG
- PNG
- GIF
- WebP

## 💡 İpuçları

1. **Performans**: Görselleri yüklemeden önce optimize edin (1920x1080 veya daha küçük)
2. **Dosya İsimleri**: Türkçe karakter ve özel karakter kullanmaktan kaçının
3. **Organize Etme**: Görselleri düzenli tutmak için anlamlı isimler kullanın
4. **Yedekleme**: `server/uploads/` klasörünü düzenli olarak yedekleyin

## 🐛 Sorun Giderme

### Görsel yüklenmiyor
- Dosya boyutunun 5MB'dan küçük olduğundan emin olun
- Dosya formatının desteklendiğinden emin olun
- `server/uploads/` klasörünün yazma izinleri olduğundan emin olun

### Görseller görünmüyor
- Sunucunun çalıştığından emin olun
- `server/uploads/` klasörünün mevcut olduğundan emin olun
- Browser console'da hata var mı kontrol edin

### "Uploads klasörü bulunamadı" hatası
```bash
cd server
mkdir uploads
```

## 🎨 Özelleştirme

### Dosya Boyutu Limitini Değiştirme

`server/config/multer.js` dosyasında:

```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB olarak değiştir
}
```

### Yeni Dosya Formatı Ekleme

`server/config/multer.js` dosyasında:

```javascript
const allowedTypes = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'image/svg+xml' // SVG ekle
];
```

## 📝 Notlar

- Yüklenen görseller `server/uploads/` klasöründe saklanır
- Görseller veritabanında sadece URL ve metadata olarak tutulur
- Bir görseli sildiğinizde hem dosya hem de veritabanı kaydı silinir
- `uploads` klasörü `.gitignore` dosyasında ignore edilmiştir

## 🔄 Güncellemeler

### v1.0.0 (İlk Sürüm)
- Görsel yükleme sistemi
- Görsel kütüphanesi sayfası
- ImagePicker component'i
- Restoran ve ürün formlarında entegrasyon
- Arama ve filtreleme özellikleri

