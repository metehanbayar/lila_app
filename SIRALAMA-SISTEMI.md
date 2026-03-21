# Sıralama Sistemi

Güncel durumda sıralama iki farklı şekilde çalışır:

- kategoriler için manuel `SortOrder`
- ürünler için admin panelde sürükle-bırak + `DisplayOrder`

## Kategori Sıralaması

Kategori sıralaması restoran bazlı değildir. Tüm restoranlar ortak kategori havuzunu kullanır.

Kategori yönetiminde:

- `SortOrder` alanı küçükten büyüğe sıralanır
- sürükle-bırak yoktur
- kategori sırası admin panelden sayı girilerek değiştirilir

İlgili dosyalar:

- `client/src/pages/admin/Categories.jsx`
- `server/routes/admin-categories.js`

## Ürün Sıralaması

Ürün sıralaması admin panelde sürükle-bırak ile yapılır.

Özellikler:

- ürünler modal içinde drag and drop ile taşınır
- backend `DisplayOrder` alanını toplu günceller
- istenirse restoran ve kategori filtresiyle daraltılmış liste sıralanabilir

Endpoint:

```text
POST /api/admin/products/reorder
```

İstek örneği:

```json
{
  "productOrders": [
    { "productId": 1, "displayOrder": 0 },
    { "productId": 2, "displayOrder": 1 }
  ]
}
```

İlgili dosyalar:

- `client/src/pages/admin/Products.jsx`
- `server/routes/admin-products.js`

## Önemli Not

Eski restoran bazlı kategori atama ve kategori sürükle-bırak sistemi artık kullanılmıyor. Kategoriler ortak yapıdadır.
