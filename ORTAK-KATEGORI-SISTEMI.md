# Ortak Kategori Sistemi

Güncel yapıda kategoriler tüm restoranlar için ortaktır.

## Nasıl Çalışır

- kategoriler tek bir `Categories` tablosunda tutulur
- restoran bazlı kategori atama sistemi yoktur
- admin panelde eklenen kategori tüm restoranlarda kullanılabilir
- ürünler `CategoryId` ile bu ortak kategori havuzuna bağlanır

## Yönetim Mantığı

Admin panelde kategori ekranı:

- global liste gösterir
- kategori ekleme, düzenleme, pasife alma işlemleri yapar
- `SortOrder` ile genel sıralama belirler

Ürün ekranı:

- seçilen restoran için ayrıca kategori atama beklemez
- aktif ortak kategorileri kullanır

## Artık Kullanılmayan Eski Yapı

Bu repo artık şunları aktif olarak kullanmaz:

- restoran-kategori atama modalı
- `RestaurantCategories` tablosuna bağlı iş akışı
- kategori için restoran bazlı sürükle-bırak sıralama

`RestaurantCategories` tablosu bazı ortamlarda veritabanında durabilir, ancak güncel uygulama akışının parçası değildir.

## İlgili Dosyalar

- `server/routes/admin-categories.js`
- `server/routes/admin-products.js`
- `server/routes/products.js`
- `client/src/pages/admin/Categories.jsx`
- `client/src/pages/admin/Products.jsx`
