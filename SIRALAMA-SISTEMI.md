# Kategori ve Ürün Sıralama Sistemi

## 📋 Genel Bakış

Admin paneline sürükle-bırak (drag & drop) özelliği ile kategori ve ürün sıralama sistemi eklenmiştir.

## ✨ Özellikler

### Kategori Sıralama
- ✅ Restorana özel kategori sıralaması
- ✅ Sürükle-bırak ile kolay sıralama
- ✅ Sadece atanmış kategoriler sürüklenebilir
- ✅ Anlık kaydetme (otomatik)
- ✅ Görsel geri bildirim (sürüklerken opacity değişimi)

### Ürün Sıralama
- ✅ Restoran ve kategoriye göre filtreleme
- ✅ Sürükle-bırak ile kolay sıralama
- ✅ Özel "Sırala" modu
- ✅ Anlık kaydetme (otomatik)
- ✅ Ürün görselleri ile birlikte sıralama

## 🎯 Kullanım

### Kategorileri Sıralama

1. **Admin Panel > Kategoriler** sayfasına gidin
2. "Restoran Kategori Atamaları" bölümünden bir restoran seçin
3. Modal açıldığında:
   - Yeşil arka planlı kategoriler o restorana atanmış
   - Sol taraftaki **üç çizgi ikonunu** tutup sürükleyin
   - Kategoriyi istediğiniz sıraya bırakın
4. Sıralama otomatik olarak kaydedilir ✨

**İpucu:** Sadece atanmış (yeşil) kategoriler sürüklenebilir. Atanmamış kategorileri önce "Ekle" butonu ile eklemelisiniz.

### Ürünleri Sıralama

1. **Admin Panel > Ürünler** sayfasına gidin
2. Sağ üstteki **"Sırala"** butonuna tıklayın
3. Sıralama modalında:
   - **Restoran filtresi** seçin (opsiyonel)
   - **Kategori filtresi** seçin (opsiyonel)
   - Sol taraftaki **üç çizgi ikonunu** tutup sürükleyin
   - Ürünü istediğiniz sıraya bırakın
4. Sıralama otomatik olarak kaydedilir ✨

**İpucu:** Filtre kullanmadan tüm ürünleri sıralayabilirsiniz, ancak belirli bir restoran veya kategori için sıralama yapmak daha pratiktir.

## 🔧 Teknik Detaylar

### Backend API

**Kategori Sıralama Endpoint:**
```
POST /api/admin/categories/restaurant/:restaurantId/reorder
Body: {
  categoryOrders: [
    { categoryId: 1, displayOrder: 0 },
    { categoryId: 2, displayOrder: 1 },
    ...
  ]
}
```

**Ürün Sıralama Endpoint:**
```
POST /api/admin/products/reorder
Body: {
  productOrders: [
    { productId: 1, displayOrder: 0 },
    { productId: 2, displayOrder: 1 },
    ...
  ]
}
```

### Frontend Teknolojisi

- **Kütüphane:** `@dnd-kit` (modern ve hafif)
- **Bileşenler:**
  - `DndContext` - Sürükle-bırak context sağlayıcı
  - `SortableContext` - Sıralanabilir liste context
  - `useSortable` - Sürüklenebilir öğe hook'u
- **Stratejiler:**
  - `verticalListSortingStrategy` - Dikey liste sıralama
  - `closestCenter` - En yakın merkez collision detection

### Veritabanı

**RestaurantCategories Tablosu:**
- `DisplayOrder` - Kategori sırası (restoran bazında)

**Products Tablosu:**
- `DisplayOrder` - Ürün sırası (global)

## 🎨 Kullanıcı Deneyimi

### Görsel İpuçları

- **Grab ikonu (⋮⋮)**: Sürüklenebilir alanı gösterir
- **Opacity değişimi**: Sürüklerken şeffaflaşma
- **Shadow efekti**: Sürüklerken gölge oluşumu
- **Cursor değişimi**: `cursor-grab` → `cursor-grabbing`

### Klavye Erişilebilirliği

- **Space/Enter**: Öğeyi seç/bırak
- **Arrow keys**: Yukarı/aşağı hareket
- **Escape**: İptal et

## 📊 Sıralama Mantığı

### Kategoriler
- Her restoran için ayrı sıralama
- DisplayOrder: 0, 1, 2, 3, ...
- Küçükten büyüğe sıralama (ASC)

### Ürünler
- Global sıralama sistemi
- DisplayOrder: 0, 1, 2, 3, ...
- Önce RestaurantCategories.DisplayOrder
- Sonra Products.DisplayOrder
- En son Products.Name (alfabetik)

## 🚀 Performans

- **Optimistik UI**: Sürükleme sonrası hemen UI güncellenir
- **Async kaydetme**: Backend'e paralel olarak kaydedilir
- **Hata yönetimi**: Hata durumunda otomatik geri yükleme
- **Bulk update**: Tüm sıralama tek seferde kaydedilir

## 🐛 Sorun Giderme

### Problem: Sürükleyemiyorum

**Çözüm:**
- Sadece yeşil (atanmış) kategorileri sürükleyebilirsiniz
- Üç çizgi ikonunu tuttuğunuzdan emin olun
- Fareyle tıklayıp tutun ve hareket ettirin

### Problem: Sıralama kaydedilmiyor

**Çözüm:**
- Browser console'da hata var mı kontrol edin (F12)
- Backend çalışıyor mu kontrol edin
- Admin token'ınızın geçerli olduğundan emin olun
- Sayfa yenilenmişse tekrar sıralayın

### Problem: Filtre çalışmıyor

**Çözüm:**
- Önce restoran seçin, sonra kategori seçin
- Kategori filtresi için restoran seçimi zorunludur
- Filtreyi temizlemek için "Tüm Restoranlar" seçin

## 📝 Notlar

- Kategori sıralaması restorana özel (her restoran kendi sırasını belirler)
- Ürün sıralaması global (tüm ürünler aynı havuzda)
- DisplayOrder 0'dan başlar
- Sıralama frontend tarafından otomatik hesaplanır
- Backend sadece yeni sıralamayı kaydeder

## 🎉 Gelecek Geliştirmeler

- [ ] Toplu ürün sıralaması (çoklu seçim)
- [ ] Kategori arası ürün taşıma
- [ ] Sıralama history/geri alma
- [ ] Ürün kopyalama
- [ ] Sürükle-bırak animasyonları

---

**Güncel Versiyon:** 2.1.0 - Drag & Drop Sorting System
**Tarih:** 2025-10-12
**Geliştirici:** AI Assistant

