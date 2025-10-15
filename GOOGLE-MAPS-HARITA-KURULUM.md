# 🗺️ Google Maps Harita Entegrasyonu - Kurulum

Artık hem adres çözümleme hem de harita görüntüsü için Google Maps kullanıyoruz!

## 📋 Kurulum Adımları

### 1. Backend API Key (Server)

`server` klasöründe `.env` dosyası oluşturun (yoksa):

```bash
GOOGLE_MAPS_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
```

### 2. Frontend API Key (Client)

`client` klasöründe `.env` dosyası oluşturun (yoksa):

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
```

⚠️ **Önemli**: Aynı API Key'i hem backend hem frontend için kullanabilirsiniz!

### 3. Uygulamayı Yeniden Başlatın

```bash
# Backend
cd server
npm run dev

# Frontend (yeni terminal)
cd client
npm run dev
```

## 🎨 Değişiklikler

### ✅ Önceki Durum (OpenStreetMap)
- Harita: OpenStreetMap (ücretsiz)
- Adres: Nominatim API (eksik detaylar)
- Kapı numarası: ❌ Çoğunlukla yok

### ✅ Yeni Durum (Google Maps)
- Harita: ✨ Google Maps (profesyonel)
- Adres: 🎯 Google Geocoding API (tam detay)
- Kapı numarası: ✅ Geliyor
- Mahalle/İlçe: ✅ Doğru geliyor

## 💰 Maliyet

- **Maps JavaScript API**: $7.00 / 1,000 yükleme
- **Geocoding API**: $5.00 / 1,000 istek
- **İlk $200 kredi**: ÜCRETSİZ ✨

**Örnek**: 100 müşteri/gün × 30 gün = 3,000 kullanım
- Maliyet: $0 (ücretsiz kredi içinde)

## 🚀 Kullanım

1. Müşteri "Konumunuzu Seçin" butonuna tıklar
2. ✨ Google Maps haritası açılır
3. Marker'ı sürükler veya haritaya tıklar
4. 🎯 Otomatik doldurulan adres bilgileri:
   - Sokak/Cadde
   - Bina No (varsa)
   - Mahalle
   - İlçe
   - İl
5. Eksik bilgileri (daire no, tarif) tamamlar
6. "Adresi Kullan" butonuna tıklar

## 🔧 Sorun Giderme

### Harita Görünmüyor / Gri Ekran

**Sebep**: Frontend .env dosyasında API Key eksik

**Çözüm**:
```bash
cd client
# .env dosyasını oluşturun
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env
# Uygulamayı yeniden başlatın
npm run dev
```

### "API Key geçersiz" Hatası

**Sebep**: Google Cloud Console'da Maps JavaScript API aktif değil

**Çözüm**:
1. [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Library
2. "Maps JavaScript API" arayın
3. "Enable" butonuna tıklayın

### Adres Gelmiyor

**Sebep**: Backend .env dosyasında API Key eksik

**Çözüm**:
```bash
cd server
# .env dosyasını oluşturun
echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env
# Server'ı yeniden başlatın
npm run dev
```

## ✨ Özellikler

### 🗺️ İnteraktif Harita
- Marker'ı sürükleyerek konum değiştirme
- Haritaya tıklayarak konum seçme
- Zoom in/out
- Profesyonel Google Maps görünümü

### 📍 Otomatik Adres Doldurma
- Sokak ve cadde adı
- Bina numarası (varsa)
- Mahalle bilgisi
- İlçe ve il
- Posta kodu

### 🔍 Adres Arama
- Adres yazarak arama
- Otomatik tamamlama önerileri
- Seçili adresi haritada gösterme

### ✏️ Manuel Düzenleme
- Tüm alanlar düzenlenebilir
- Daire no ekleme
- Adres tarifi (ör: "Yeşil bina")

## 📚 Daha Fazla Bilgi

- [Google Maps Platform](https://mapsplatform.google.com/)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)

## 🎯 Kontrol Listesi

- [ ] Backend .env dosyası oluşturuldu
- [ ] Frontend .env dosyası oluşturuldu
- [ ] API Key her iki dosyaya da eklendi
- [ ] Geocoding API aktif edildi
- [ ] Maps JavaScript API aktif edildi
- [ ] Server yeniden başlatıldı
- [ ] Client yeniden başlatıldı
- [ ] Harita Google Maps olarak görünüyor ✨
- [ ] Adres detayları doğru geliyor ✅

