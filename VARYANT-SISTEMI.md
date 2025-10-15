# Ürün Varyant Sistemi

## Genel Bakış

Ürünler artık birden fazla fiyat seçeneğine (varyant) sahip olabilir. Örneğin:
- Tam Porsiyon / Yarım Porsiyon
- Büyük Boy / Orta Boy / Küçük Boy
- 250g / 500g / 1kg

## Veritabanı Değişiklikleri

### Yeni Tablo: ProductVariants

```sql
CREATE TABLE ProductVariants (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    IsDefault BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);
```

### OrderItems Tablosuna Eklenen Sütunlar

```sql
ALTER TABLE OrderItems 
ADD VariantId INT NULL,
    VariantName NVARCHAR(100) NULL;
```

## Migration Nasıl Çalıştırılır?

```bash
# SQL Server Management Studio'da veya Azure Data Studio'da:
# server/database/migrations/add-product-variants.sql dosyasını çalıştırın
```

Bu migration:
1. ProductVariants tablosunu oluşturur
2. OrderItems tablosuna varyant bilgilerini ekler
3. Mevcut tüm ürünler için otomatik olarak "Standart" adında varsayılan varyant oluşturur

## Backend API Endpoints

### Product Variants Endpoints

```
GET    /api/admin/product-variants/product/:productId   - Ürünün varyantlarını getir
GET    /api/admin/product-variants/:id                  - Tek varyant detayı
POST   /api/admin/product-variants                      - Yeni varyant oluştur
PUT    /api/admin/product-variants/:id                  - Varyant güncelle
DELETE /api/admin/product-variants/:id                  - Varyant sil (soft delete)
POST   /api/admin/product-variants/bulk-update/:productId - Toplu varyant güncelle
```

### Güncellenmiş Public Endpoints

```
GET /api/products/restaurant/:restaurantId  - Artık varyantlarla birlikte gelir
GET /api/products/:id                       - Artık varyantlarla birlikte gelir
```

## Frontend Kullanımı

### 1. Admin Panel - Varyant Yönetimi

Admin panelinde ürün listesinde her ürün için "Varyantlar" butonu bulunur.

**Varyant Ekleme:**
1. Admin > Ürünler sayfasına git
2. İlgili ürünün yanındaki "Varyantlar" butonuna tıkla
3. "Varyant Ekle" butonuyla yeni varyant ekle
4. Varyant adı ve fiyatı gir
5. Varsayılan varyantı işaretleyebilirsin
6. "Kaydet" butonuyla kaydet

**Örnek Kullanım:**
- Ürün: Adana Kebap
  - Varyant 1: Yarım Porsiyon - 80₺ (Varsayılan)
  - Varyant 2: Tam Porsiyon - 140₺

### 2. Müşteri Tarafı - Varyant Seçimi

**ProductDetailModal:**
- Ürün detay modalında otomatik olarak varyant seçim alanı görünür
- Varsayılan varyant otomatik seçilir
- Müşteri farklı porsiyon seçebilir
- Fiyat otomatik güncellenir

**Sepet:**
- Aynı ürünün farklı varyantları ayrı satırlar olarak görünür
- Her varyant bağımsız olarak artırılıp azaltılabilir
- Örnek: "Adana Kebap (Tam Porsiyon)" ve "Adana Kebap (Yarım Porsiyon)" ayrı görünür

### 3. Sipariş Sistemi

**Sipariş Oluşturma:**
- Varyant bilgisi siparişle birlikte kaydedilir
- OrderItems tablosunda VariantId ve VariantName saklanır
- Fiyat varyanta göre hesaplanır

**E-posta Bildirimleri:**
- Sipariş e-postasında varyant bilgisi gösterilir
- Örnek: "Adana Kebap (Tam Porsiyon) x2"

## Kod Örnekleri

### Backend - Varyant ile Sipariş Oluşturma

```javascript
// Frontend'den gelen sipariş verisi
const orderData = {
  customerName: "Ahmet Yılmaz",
  customerPhone: "5551234567",
  customerAddress: "...",
  items: [
    {
      productId: 1,
      quantity: 2,
      variantId: 5,           // Varyant ID'si
      variantName: "Tam Porsiyon"  // Varyant adı
    }
  ]
};
```

### Frontend - Sepete Varyantlı Ürün Ekleme

```javascript
// ProductDetailModal.jsx
const handleAddToCart = () => {
  for (let i = 0; i < quantity; i++) {
    addItem(product, selectedVariant);  // Varyant bilgisiyle ekle
  }
  onClose();
};
```

### Frontend - Sepetten Varyantlı Ürün Silme

```javascript
// Cart.jsx
removeItem(item.Id, item.selectedVariant?.Id)
```

## Önemli Notlar

### Geriye Uyumluluk
- Varyantı olmayan eski ürünler için migration otomatik "Standart" varyant oluşturur
- Mevcut siparişler etkilenmez
- Frontend varyant yoksa normal fiyatı kullanır

### Varsayılan Varyant
- Her ürünün en az bir varsayılan varyantı olmalıdır
- Varsayılan varyant modal açıldığında otomatik seçilir
- Bir varyant varsayılan yapılınca diğerleri otomatik false olur

### Sepet Yönetimi
- Varyant ID'si ile ürünler unique tutulur
- Aynı ürünün farklı varyantları ayrı sepet satırları oluşturur
- `item.effectivePrice` varyant veya ürün fiyatını tutar

## Test Senaryoları

### 1. Yeni Ürün İçin Varyant Ekleme
1. Admin panelinde yeni ürün oluştur
2. Ürünün "Varyantlar" butonuna tıkla
3. "Yarım Porsiyon - 50₺" ve "Tam Porsiyon - 90₺" ekle
4. "Yarım Porsiyon"u varsayılan yap
5. Kaydet

### 2. Müşteri Varyant Seçimi
1. Restoran menüsünde ürüne tıkla
2. Modal açılınca varsayılan varyantın seçili olduğunu doğrula
3. Farklı varyant seç
4. Fiyatın güncellendiğini doğrula
5. Sepete ekle
6. Sepette doğru varyantın göründüğünü kontrol et

### 3. Sipariş Verme
1. Farklı varyantlardan ürün ekle
2. Checkout sayfasında varyant bilgilerinin göründüğünü doğrula
3. Siparişi tamamla
4. Sipariş detaylarında varyant bilgilerinin kaydedildiğini kontrol et

## Sorun Giderme

### Varyantlar Görünmüyor
- Migration çalıştırıldı mı kontrol edin
- Backend'de `/api/admin/product-variants` route'u eklenmiş mi kontrol edin
- Browser console'da hata var mı bakın

### Fiyat Güncellenmiyor
- `selectedVariant` state'inin doğru set edildiğini kontrol edin
- `currentPrice` hesaplamasını kontrol edin
- `effectivePrice` sepet item'ında mevcut mu kontrol edin

### Sepette Aynı Ürün Birleşiyor
- Sepet store'da varyant ID karşılaştırması yapılıyor mu kontrol edin
- Cart.jsx'de `key` prop'unun varyant ID'sini içerdiğini doğrulayın

## Gelecek Geliştirmeler

- [ ] Varyant görselleri (her varyant için ayrı görsel)
- [ ] Varyant stok takibi
- [ ] Varyant kombinasyonları (Boyut + Ekstra malzeme)
- [ ] Toplu varyant kopyalama (bir üründen diğerine)
- [ ] Varyant bazlı indirimler

