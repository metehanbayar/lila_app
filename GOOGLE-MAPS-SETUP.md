# 🗺️ Google Maps API Kurulum Rehberi

Bu proje, detaylı adres bilgileri almak için Google Maps Geocoding API kullanmaktadır.

## 📋 Gereksinimler

- Google Cloud Platform hesabı
- Kredi kartı (ilk $200 ücretsiz kredi için, ücret kesilmez)

## 🔑 API Key Alma Adımları

### 1. Google Cloud Console'a Giriş

1. [Google Cloud Console](https://console.cloud.google.com) adresine gidin
2. Google hesabınızla giriş yapın

### 2. Yeni Proje Oluşturma

1. Üst menüden proje seçicisini tıklayın
2. **"New Project"** butonuna tıklayın
3. Proje adı girin (örn: "GlobalMenu")
4. **"Create"** butonuna tıklayın

### 3. Billing (Faturalama) Aktif Etme

⚠️ **Önemli**: Google Maps API kullanmak için faturalama aktif olmalıdır, ancak:
- İlk kayıtta $200 ücretsiz kredi verilir
- Bu kredi 90 gün geçerlidir
- Küçük-orta ölçekli projeler için genellikle yeterlidir
- Kredi bitmeden ücret kesilmez

1. Sol menüden **"Billing"** bölümüne gidin
2. **"Link a billing account"** veya **"Create billing account"** seçin
3. Kredi kartı bilgilerinizi girin (doğrulama için)
4. Faturalama hesabını projeyle ilişkilendirin

### 4. Geocoding API'yi Aktif Etme

1. Sol menüden **"APIs & Services"** > **"Library"** bölümüne gidin
2. Arama çubuğuna **"Geocoding API"** yazın
3. **"Geocoding API"** sonucuna tıklayın
4. **"Enable"** (Etkinleştir) butonuna tıklayın

### 5. API Key Oluşturma

1. Sol menüden **"APIs & Services"** > **"Credentials"** bölümüne gidin
2. Üstteki **"+ CREATE CREDENTIALS"** butonuna tıklayın
3. **"API key"** seçeneğini seçin
4. API Key otomatik oluşturulacak
5. **"CLOSE"** butonuna tıklayın (veya API Key'i kopyalayın)

### 6. API Key Güvenliği (Önerilen)

API Key'inizi güvenceye almak için:

1. Oluşturduğunuz API Key'in yanındaki **düzenle** ikonuna tıklayın
2. **"Application restrictions"** bölümünde:
   - Geliştirme için: **"None"** seçili bırakabilirsiniz
   - Canlı ortam için: **"HTTP referrers"** seçin ve domain'inizi ekleyin
3. **"API restrictions"** bölümünde:
   - **"Restrict key"** seçeneğini işaretleyin
   - **"Geocoding API"** seçeneğini seçin
4. **"Save"** butonuna tıklayın

## ⚙️ Projeye Entegrasyon

### 1. API Key'i .env Dosyasına Ekleme

1. `server` klasöründe `.env.example` dosyasını kopyalayın
2. Kopyayı `.env` olarak adlandırın
3. `GOOGLE_MAPS_API_KEY` satırına API Key'inizi yapıştırın:

```bash
GOOGLE_MAPS_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
```

### 2. Server'ı Yeniden Başlatma

API Key'i ekledikten sonra server'ı yeniden başlatın:

```bash
cd server
npm run dev
```

## 💰 Maliyet Hesaplama

### Geocoding API Fiyatlandırması (2024)

- **İlk 40,000 istek/ay**: $200 ücretsiz krediyle karşılanır
- **Sonraki istekler**: $5.00 / 1,000 istek

### Örnek Senaryolar

**Küçük İşletme (100 sipariş/gün)**
- Aylık: ~3,000 adres sorgusu
- Maliyet: $0 (ücretsiz kredi içinde)

**Orta Ölçekli İşletme (500 sipariş/gün)**
- Aylık: ~15,000 adres sorgusu
- Maliyet: $0 (ücretsiz kredi içinde)

**Büyük İşletme (2000 sipariş/gün)**
- Aylık: ~60,000 adres sorgusu
- Ücretsiz kredi ile: İlk 40,000 istek
- Ücretli: 20,000 istek × $5/1000 = **$100/ay**

## 🔍 API Kullanımını İzleme

1. [Google Cloud Console](https://console.cloud.google.com) > **"APIs & Services"** > **"Dashboard"**
2. Geocoding API kullanım grafiklerini görüntüleyin
3. Günlük/aylık sorgu sayısını takip edin

## 🚨 Sorun Giderme

### "API Key geçersiz" Hatası
- API Key'in doğru kopyalandığından emin olun
- Geocoding API'nin aktif olduğunu kontrol edin
- Faturalama hesabının bağlı olduğunu doğrulayın

### "Quota exceeded" Hatası
- Günlük/aylık limitinizi kontrol edin
- Gerekirse quota artırımı talep edin

### API Key Çalışmıyor
- API Key oluşturulduktan sonra 1-2 dakika bekleyin
- Server'ı yeniden başlatın
- .env dosyasının doğru yerde olduğunu kontrol edin

## 🆓 Ücretsiz Alternatif

Eğer Google Maps API kullanmak istemiyorsanız:
- Mevcut kod zaten kullanıcıların manuel adres girişini destekliyor
- Harita sadece genel konum için kullanılıyor
- Tüm detaylar kullanıcı tarafından girilebiliyor

## 📚 Daha Fazla Bilgi

- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

## ✅ Kontrol Listesi

- [ ] Google Cloud hesabı oluşturuldu
- [ ] Yeni proje oluşturuldu
- [ ] Billing aktif edildi
- [ ] Geocoding API etkinleştirildi
- [ ] API Key oluşturuldu
- [ ] API Key `.env` dosyasına eklendi
- [ ] Server yeniden başlatıldı
- [ ] Test edildi ✨

