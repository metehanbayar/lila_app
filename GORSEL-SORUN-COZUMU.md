# Görsel Görüntülenme Sorunu - Çözüm

## 🔧 Yapılan Düzeltmeler

### Sorun
Görseller yükleniyordu ancak ekranda görünmüyordu. URL'ler yanlış oluşturuluyordu.

### Çözüm

#### 1. Vite Proxy Ayarı Eklendi
`client/vite.config.js` dosyasına `/uploads` klasörü için proxy eklendi:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
  '/uploads': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

#### 2. Frontend URL Yapısı Düzeltildi
Tüm frontend dosyalarında `window.location.origin` eklenmesi kaldırıldı. Artık URL'ler direkt olarak kullanılıyor:

**Önce:**
```javascript
src={`${window.location.origin}${media.FileUrl}`}
```

**Sonra:**
```javascript
src={media.FileUrl}
```

**Düzeltilen Dosyalar:**
- ✅ `client/src/pages/admin/Media.jsx`
- ✅ `client/src/components/admin/ImagePicker.jsx`

## 🚀 Uygulamak İçin

### Adım 1: Sunucuları Yeniden Başlatın

**Backend (Sunucu):**
```bash
# Ctrl+C ile durdurun
cd server
npm run dev
```

**Frontend (Client):**
```bash
# Ctrl+C ile durdurun
cd client
npm run dev
```

### Adım 2: Tarayıcıyı Yenileyin
- Tarayıcıda `Ctrl+Shift+R` (Hard Refresh) yapın
- Veya tarayıcıyı tamamen kapatıp yeniden açın

### Adım 3: Test Edin
1. Admin paneline giriş yapın
2. "Görsel Kütüphanesi" sayfasına gidin
3. Yeni bir görsel yükleyin
4. Görsel artık düzgün görünmeli
5. Restoran veya ürün formunda görseli seçin
6. Görsel kartlarda da görünmeli

## 🔍 Nasıl Çalışıyor?

### Development (Geliştirme)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Vite proxy sayesinde `/uploads/...` istekleri otomatik olarak backend'e yönlendirilir

### Production (Canlı)
- Her iki uygulama da aynı domain'de çalışacak
- Görseller `/uploads/...` yolunda erişilebilir olacak

## 📝 Teknik Detaylar

### URL Formatı
- Backend'de kayıt: `/uploads/filename-123456789.jpg`
- Frontend'de kullanım: Direkt bu URL
- Vite proxy: `http://localhost:5173/uploads/...` → `http://localhost:3000/uploads/...`

### Dosya Akışı
1. Kullanıcı görsel yükler
2. Backend `server/uploads/` klasörüne kaydeder
3. Veritabanına `/uploads/filename.jpg` olarak kaydeder
4. Frontend bu URL'i alır ve kullanır
5. Vite proxy isteği backend'e yönlendirir
6. Backend static dosya servisi görseli döner

## ✅ Kontrol Listesi

Görsellerin düzgün çalıştığını doğrulamak için:

- [ ] Backend sunucusu çalışıyor (`http://localhost:3000`)
- [ ] Frontend çalışıyor (`http://localhost:5173`)
- [ ] `server/uploads/` klasörü mevcut
- [ ] Media tablosu veritabanında mevcut
- [ ] Yeni görsel yükleme çalışıyor
- [ ] Yüklenen görseller Media sayfasında görünüyor
- [ ] ImagePicker'da görseller görünüyor
- [ ] Restoran kartlarında görseller görünüyor
- [ ] Ürün kartlarında görseller görünüyor

## 🐛 Hala Sorun Varsa

### Console'u Kontrol Edin
Tarayıcıda `F12` ile Developer Tools açın ve Console sekmesine bakın:

**Yaygın Hatalar:**

1. **404 Not Found (uploads/...)**
   - Çözüm: Backend sunucusunun çalıştığından emin olun
   - Çözüm: Vite config değişikliği sonrası frontend'i yeniden başlatın

2. **CORS Hatası**
   - Çözüm: Backend'de CORS ayarları zaten yapılandırılmış, sunucuyu yeniden başlatın

3. **Görsel Yüklenmiyor**
   - Çözüm: `server/uploads/` klasörüne yazma izni olduğundan emin olun
   - Windows: Klasöre sağ tık → Properties → Security

### Network Sekmesini Kontrol Edin
1. F12 → Network sekmesi
2. Görsel yükleme denemesi yapın
3. İstekleri inceleyin:
   - `POST /api/admin/media/upload` → 200 OK olmalı
   - `GET /uploads/...` → 200 OK olmalı

### Backend Loglarını Kontrol Edin
Terminal'de backend loglarına bakın. Hata mesajı varsa orada görünecektir.

## 💡 Ek Notlar

- Development ortamında proxy kullanılıyor
- Production'da nginx veya benzeri web server ile static dosyalar serve edilmeli
- Görseler production'da build edilmiş client ile aynı sunucuda olmalı

