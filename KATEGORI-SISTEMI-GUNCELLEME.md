# Kategori Sistemi Güncelleme Rehberi

## 📋 Genel Bakış

Kategori sistemi, tüm restoranlar için **ortak/paylaşımlı** hale getirilmiştir. Bu güncelleme ile:

- ✅ Kategoriler artık global/ortak bir havuzda tutulur
- ✅ Her restoran istediği kategorileri seçerek kullanabilir
- ✅ Aynı kategori birden fazla restoranda kullanılabilir
- ✅ Kategori ekleme/düzenleme merkezi bir yerden yapılır
- ✅ Her restoran için kategori atama/kaldırma ayrı ayrı yönetilir

## 🗄️ Veritabanı Değişiklikleri

### Yeni Yapı

**Categories Tablosu** (Global kategoriler)
```sql
CREATE TABLE Categories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

**RestaurantCategories Tablosu** (Junction table - Restoran-Kategori ilişkileri)
```sql
CREATE TABLE RestaurantCategories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    RestaurantId INT NOT NULL,
    CategoryId INT NOT NULL,
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id),
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    UNIQUE(RestaurantId, CategoryId)
);
```

### Migration Uygulama

**ÖNEMLİ:** Mevcut verileri korumak için migration dosyası otomatik olarak:
1. Yeni `RestaurantCategories` tablosunu oluşturur
2. Mevcut kategori verilerini yeni tabloya taşır
3. `Categories` tablosundan `RestaurantId` kolonunu kaldırır

**Migration Dosyası:** `server/database/migrations/shared-categories.sql`

### Adım Adım Uygulama

1. **Veritabanı yedeği alın** (ÇOK ÖNEMLİ!)
   ```bash
   # SQL Server Management Studio'da veritabanına sağ tıklayın
   # Tasks > Back Up... seçeneğini kullanın
   ```

2. **Migration dosyasını çalıştırın**
   ```bash
   # SQL Server Management Studio'da
   # File > Open > File... ile migration dosyasını açın
   # Execute (F5) ile çalıştırın
   ```

3. **Değişiklikleri kontrol edin**
   ```sql
   -- Yeni tablo yapısını kontrol et
   SELECT * FROM Categories;
   SELECT * FROM RestaurantCategories;
   
   -- Verilerin taşındığını doğrula
   SELECT 
       r.Name as RestaurantName,
       c.Name as CategoryName,
       rc.DisplayOrder
   FROM RestaurantCategories rc
   JOIN Restaurants r ON rc.RestaurantId = r.Id
   JOIN Categories c ON rc.CategoryId = c.Id
   ORDER BY r.Name, rc.DisplayOrder;
   ```

## 🎨 Frontend Değişiklikleri

### Yeni Kategori Sayfası Özellikleri

**Admin Panel > Kategoriler**

1. **Global Kategori Listesi**
   - Tüm kategorileri tek bir listede gösterir
   - Her kategorinin kaç restoranda kullanıldığını gösterir

2. **Restoran Kategori Atamaları**
   - Her restoran için ayrı kategori yönetim paneli
   - Kategorileri restorana ekle/kaldır
   - Görsel ve kullanıcı dostu arayüz

3. **Kategori Ekleme/Düzenleme**
   - Merkezi kategori oluşturma
   - Kategori ismi düzenleme
   - Aktif/pasif durumu yönetimi

### Ürün Sayfası Değişiklikleri

**Admin Panel > Ürünler**

- Restoran seçildiğinde sadece o restorana atanmış kategoriler gösterilir
- Eğer restorana kategori atanmamışsa uyarı mesajı gösterilir
- Kategori ataması için Kategoriler sayfasına yönlendirme

## 🔧 Backend API Değişiklikleri

### Yeni Endpoint'ler

```javascript
// Restorana kategori ata
POST /api/admin/categories/restaurant/:restaurantId/assign
Body: { categoryId, displayOrder }

// Restorandan kategori kaldır
DELETE /api/admin/categories/restaurant/:restaurantId/remove/:categoryId

// Restorana ait kategorileri getir (güncellendi)
GET /api/admin/categories/restaurant/:restaurantId
// Artık hem atanmış hem de atanmamış kategorileri döndürür
```

### Güncellenen Endpoint'ler

```javascript
// Tüm kategorileri getir (güncellendi)
GET /api/admin/categories
// Artık kaç restoranda kullanıldığı bilgisini de içerir

// Kategori oluştur (basitleştirildi)
POST /api/admin/categories
Body: { name, isActive }
// RestaurantId artık gerekli değil

// Kategori güncelle (basitleştirildi)
PUT /api/admin/categories/:id
Body: { name, isActive }
// RestaurantId artık gerekli değil
```

## 📝 Kullanım Senaryoları

### Senaryo 1: Yeni Global Kategori Ekleme

1. Admin Panel > Kategoriler sayfasına gidin
2. "Yeni Kategori" butonuna tıklayın
3. Kategori adını girin (örn: "Tatlılar")
4. Kaydet

**Sonuç:** Kategori tüm restoranlar için kullanıma hazır hale gelir.

### Senaryo 2: Restorana Kategori Atama

1. Admin Panel > Kategoriler sayfasına gidin
2. "Restoran Kategori Atamaları" bölümünden bir restoran seçin
3. Eklemek istediğiniz kategorilerin "Ekle" butonuna tıklayın
4. İstemediğiniz kategorilerin "Kaldır" butonuna tıklayın

**Sonuç:** Seçilen kategoriler sadece o restoran için kullanılabilir hale gelir.

### Senaryo 3: Ürüne Kategori Atama

1. Admin Panel > Ürünler sayfasına gidin
2. Yeni ürün ekleyin veya mevcut ürünü düzenleyin
3. Önce restoran seçin
4. Kategori listesinden (sadece o restorana atanmış kategoriler) birini seçin

**Not:** Eğer restorana kategori atanmamışsa uyarı mesajı göreceksiniz.

## ⚠️ Önemli Notlar

1. **Migration Geri Alınamaz:** Migration uygulandıktan sonra geri almak zordur. Mutlaka yedek alın!

2. **Mevcut Veriler:** Mevcut kategoriler ve ürünler korunur. Migration otomatik olarak veri taşıma işlemini yapar.

3. **Ürün-Kategori İlişkisi:** Products tablosu değişmez. Ürünler hala CategoryId ile kategorilere bağlıdır.

4. **Kategori Silme:** Bir kategoriyi silmeden önce:
   - O kategoriye ait ürünlerin silinmesi veya başka kategoriye taşınması gerekir
   - Kategori silindiğinde tüm restoranlardaki atamaları da silinir

5. **Performans:** Junction table kullanımı sayesinde performans artışı sağlanır. İndeksler otomatik oluşturulur.

## 🐛 Sorun Giderme

### Problem: Migration hatası alıyorum

**Çözüm:**
1. SQL Server Management Studio'da hata mesajını okuyun
2. Veritabanı bağlantısının aktif olduğundan emin olun
3. Admin yetkilerinizi kontrol edin
4. Migration dosyasını adım adım çalıştırmayı deneyin

### Problem: Kategori listesi boş görünüyor

**Çözüm:**
1. Backend'in çalıştığından emin olun
2. Browser console'da hata var mı kontrol edin
3. `/api/admin/categories` endpoint'ine istek atılıyor mu kontrol edin
4. Admin token'ınızın geçerli olduğundan emin olun

### Problem: Restorana kategori atayamıyorum

**Çözüm:**
1. Önce global kategori oluşturun
2. Kategori aktif durumda olmalı
3. Backend console'da hata mesajlarını kontrol edin
4. RestaurantCategories tablosunda UNIQUE constraint hatası alıyorsanız, kategori zaten atanmış demektir

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Backend loglarını kontrol edin: `server/` klasöründe
2. Browser console'ı kontrol edin (F12)
3. Veritabanı verilerini kontrol edin
4. Migration dosyasının tamamen çalıştığından emin olun

## ✅ Test Checklist

Migration sonrası kontrol listesi:

- [ ] Tüm kategoriler görünüyor
- [ ] Yeni kategori oluşturabiliyorum
- [ ] Kategori düzenleyebiliyorum
- [ ] Restorana kategori atayabiliyorum
- [ ] Restorandan kategori kaldırabiliyorum
- [ ] Ürün oluştururken sadece atanmış kategorileri görüyorum
- [ ] Mevcut ürünler kategorileriyle birlikte görünüyor
- [ ] Kategori sıralama çalışıyor

---

**Güncelleme Tarihi:** 2025-10-12
**Versiyon:** 2.0.0 - Shared Categories System

