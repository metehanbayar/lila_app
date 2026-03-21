# Google Maps Kurulum Rehberi

Bu proje Google Maps'i iki yerde kullanır:

- backend: adres çözümleme için `GOOGLE_MAPS_API_KEY`
- frontend: harita bileşeni için `VITE_GOOGLE_MAPS_API_KEY`

## Gereksinimler

Google Cloud tarafında şu servisler açık olmalıdır:

- Geocoding API
- Maps JavaScript API

## 1. API Key Oluştur

1. [Google Cloud Console](https://console.cloud.google.com) içinde proje açın.
2. Billing aktif edin.
3. `APIs & Services > Library` bölümünden:
   - `Geocoding API`
   - `Maps JavaScript API`
   servislerini etkinleştirin.
4. `APIs & Services > Credentials` bölümünden bir API key üretin.

## 2. Server Env Ayarı

`server/.env` içinde:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Bu anahtar backend tarafında `/api/geocode/*` akışında kullanılır.

## 3. Client Env Ayarı

`client/.env` içinde:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Bu anahtar frontend tarafında harita modalı içinde kullanılır.

İsterseniz development ortamında aynı anahtarı iki tarafta da kullanabilirsiniz. Production ortamında kısıtlar tanımlamanız daha doğru olur.

## 4. Uygulamayı Yeniden Başlat

```bash
cd server
npm run dev
```

ayrı terminalde:

```bash
cd client
npm run dev
```

## 5. Doğrulama

- müşteri adres seçim ekranında harita açılmalı
- backend geocode istekleri hata vermemeli
- eksik anahtar durumunda backend anlamlı hata dönmeli

## Sorun Giderme

### Harita açılmıyor

- `client/.env` içinde `VITE_GOOGLE_MAPS_API_KEY` var mı kontrol edin
- `Maps JavaScript API` açık mı kontrol edin
- client yeniden başlatıldı mı kontrol edin

### Adres çözümleme çalışmıyor

- `server/.env` içinde `GOOGLE_MAPS_API_KEY` var mı kontrol edin
- `Geocoding API` açık mı kontrol edin
- server yeniden başlatıldı mı kontrol edin

### API key hatası alıyorum

- key kopyası yanlış olabilir
- billing aktif olmayabilir
- API restriction yanlış servislerle sınırlandırılmış olabilir

## Güvenlik Notu

Örnek dokümanlarda gerçek anahtar görünümünde string tutmayın. Her zaman `your_google_maps_api_key` gibi placeholder kullanın.

## İlgili Dosyalar

- `server/routes/geocode.js`
- `client/src/components/LocationPickerModal.jsx`
- `server/.env.example`
- `client/.env.example`
