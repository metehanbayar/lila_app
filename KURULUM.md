# 📦 Hızlı Kurulum Kılavuzu

Bu döküman, projeyi yerel ortamda çalıştırmak için gereken adımları açıklar.

## ⚡ Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm run install-all
```

Bu komut root, client ve server klasörlerindeki tüm paketleri yükler.

### 2. Veritabanı Kurulumu

#### MSSQL Server'da veritabanı oluşturun:

1. SQL Server Management Studio'yu açın
2. Yeni bir veritabanı oluşturun: `LilaGroupMenu`
3. `server/database/schema.sql` dosyasını çalıştırın
4. (Opsiyonel) `server/database/seed.sql` dosyasını çalıştırın (örnek veriler için)

### 3. Environment Variables

#### Backend

`server/.env.example` dosyasını `server/.env` olarak kopyalayın ve düzenleyin:

```bash
cp server/.env.example server/.env
```

Gerekli alanları doldurun:
- `DB_SERVER`: MSSQL sunucu adresi
- `DB_USER`: Veritabanı kullanıcı adı
- `DB_PASSWORD`: Veritabanı şifresi
- `EMAIL_*`: E-posta SMTP bilgileri

#### Frontend

`client/.env.example` dosyasını `client/.env` olarak kopyalayın:

```bash
cp client/.env.example client/.env
```

Default ayarlar development için yeterlidir.

### 4. Projeyi Çalıştır

```bash
npm run dev
```

Bu komut hem backend (port 3000) hem de frontend (port 5173) sunucularını başlatır.

### 5. Tarayıcıda Aç

```
http://localhost:5173
```

## 🔧 Ayrı Ayrı Çalıştırma

### Sadece Backend

```bash
cd server
npm run dev
```

### Sadece Frontend

```bash
cd client
npm run dev
```

## 🏗️ Production Build

### Frontend Build

```bash
cd client
npm run build
```

Build dosyaları `client/dist/` klasöründe oluşturulur.

### Backend

Backend production modunda çalıştırmak için:

```bash
cd server
NODE_ENV=development npm start
```

## ✅ Kurulum Kontrolü

### Backend API Test

```bash
curl http://localhost:3000/api/health
```

Başarılı yanıt:
```json
{
  "status": "OK",
  "message": "Lila Group Menu API çalışıyor"
}
```

### Veritabanı Bağlantı Test

```bash
cd server
node -e "require('./config/database.js').getConnection().then(() => console.log('✅ Veritabanı bağlantısı başarılı')).catch(err => console.error('❌ Hata:', err))"
```

## 📝 Notlar

- Node.js 18 veya üzeri gereklidir
- MSSQL Server dış kaynakta olmalıdır (örnek: Azure SQL, AWS RDS)
- Gmail SMTP için App Password kullanmanız gerekir (2FA aktif olmalı)
- Development modda CORS varsayılan olarak tüm originlere açıktır

## 🐛 Yaygın Sorunlar

### Port zaten kullanımda

Backend port 3000, frontend port 5173 kullanır. Eğer bu portlar kullanımdaysa:

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MSSQL Bağlantı Hatası

- `.env` dosyasındaki bilgileri kontrol edin
- MSSQL Server'ın TCP/IP bağlantılarını kabul ettiğinden emin olun
- Firewall ayarlarını kontrol edin
- Encryption ayarlarını kontrol edin (`DB_ENCRYPT=true/false`)

### Modül bulunamadı hatası

```bash
# Tüm bağımlılıkları tekrar yükle
npm run install-all
```

## 🎨 Özelleştirme

### Renk Paleti

`client/tailwind.config.js` dosyasından tema renklerini değiştirebilirsiniz:

```js
colors: {
  primary: {
    DEFAULT: '#EC4899',  // Fuşya
    dark: '#DB2777',
    light: '#F9A8D4',
  },
  secondary: {
    DEFAULT: '#22C55E',  // Yeşil
    dark: '#16A34A',
    light: '#86EFAC',
  },
  dark: {
    DEFAULT: '#1F2937',  // Siyah
    light: '#374151',
    lighter: '#4B5563',
  },
}
```

### Font

`client/index.html` dosyasından Google Fonts linkini değiştirebilirsiniz.

## 🚀 Sonraki Adımlar

- Production kurulum için `README.md` dökümanına bakın
- API dökümanları için `README.md` dosyasını inceleyin
- Plesk CentOS kurulum için detaylı rehber: `README.md`

---

**İyi Geliştirmeler!** 🎉

