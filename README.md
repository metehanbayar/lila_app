# 🍽️ Lila Group Menü - Restoran Sipariş Sistemi

Modern, mobile-first, premium restoran menü ve online sipariş yönetim sistemi.

## ✨ Özellikler

- 🎨 **Modern UI/UX**: Mobile-first responsive tasarım, Poppins font, fuşya/yeşil/siyah renk paleti
- 🍴 **3 Restoran Konsepti**: Lila Steakhouse, Lila Bistro, Lila Lounge
- 📱 **Tam Responsive**: Mobil, tablet ve desktop uyumlu
- 🛒 **Sepet Sistemi**: Floating cart button, real-time güncelleme
- 📧 **Sipariş Bildirimi**: Otomatik e-posta bildirimi
- 🔒 **Güvenli**: Helmet.js, rate limiting, SQL injection koruması
- ⚡ **Hızlı**: Vite build, optimized chunks, lazy loading
- 💾 **MSSQL Veritabanı**: Dış kaynak MSSQL desteği

## 🛠️ Teknoloji Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool ve dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management (sepet)
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - İkonlar

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MSSQL** - Veritabanı (dış kaynak)
- **Nodemailer** - E-posta gönderimi
- **Helmet** - Security headers
- **Express Rate Limit** - DDoS koruması

## 📋 Gereksinimler

- Node.js 18+ 
- MSSQL Server (dış kaynak)
- SMTP sunucusu (e-posta için)

## 🚀 Kurulum

### 1. Projeyi İndirin

```bash
cd globalmenu
```

### 2. Bağımlılıkları Yükleyin

```bash
npm run install-all
```

Bu komut root, client ve server klasörlerindeki tüm bağımlılıkları yükler.

### 3. Veritabanını Oluşturun

MSSQL Server'da veritabanını oluşturun:

```sql
-- server/database/schema.sql dosyasını çalıştırın
-- Ardından server/database/seed.sql dosyasını çalıştırın (örnek veriler için)
```

### 4. Ortam Değişkenlerini Ayarlayın

#### Backend (.env)

`server/.env.example` dosyasını `server/.env` olarak kopyalayın ve düzenleyin:

```env
PORT=3000
NODE_ENV=development

# MSSQL Database (External)
DB_SERVER=your-mssql-server.com
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

CORS_ORIGIN=https://yourdomain.com
```

#### Frontend (.env)

`client/.env.example` dosyasını `client/.env` olarak kopyalayın:

```env
VITE_API_URL=https://yourdomain.com/api
```

## 💻 Development

Geliştirme modunda çalıştırın:

```bash
npm run dev
```

Bu komut hem backend (port 3000) hem de frontend (port 5173) sunucularını başlatır.

## 🏗️ Production Build

### Frontend Build

```bash
cd client
npm run build
```

Build dosyaları `client/dist` klasörüne oluşturulur.

### Backend

Backend için ayrı build gerekmiyor, Node.js doğrudan çalıştırır.

## 🌐 Plesk CentOS Kurulum

### 1. Sunucu Gereksinimleri

- Node.js 18+
- PM2 (process manager)
- Nginx (reverse proxy)

### 2. Dosyaları Yükleyin

Projeyi Plesk'e yükleyin (FTP, Git, vb.)

```bash
/var/www/vhosts/yourdomain.com/httpdocs/
```

### 3. Backend Setup

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
npm install --production
```

`.env` dosyasını oluşturun ve yapılandırın.

### 4. PM2 ile Backend'i Başlatın

```bash
npm install -g pm2
cd /var/www/vhosts/yourdomain.com/httpdocs/server
pm2 start server.js --name "lila-menu-api"
pm2 save
pm2 startup
```

### 5. Frontend Build ve Kurulum

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/client
npm install
npm run build
```

Build dosyalarını (`dist/`) web root'a taşıyın:

```bash
cp -r dist/* /var/www/vhosts/yourdomain.com/public_html/
```

### 6. Nginx Yapılandırması

Plesk Nginx ayarlarına ekleyin:

```nginx
# API proxy
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# Frontend SPA routing
location / {
    try_files $uri $uri/ /index.html;
}
```

### 7. SSL Sertifikası

Plesk'ten Let's Encrypt SSL sertifikası etkinleştirin.

## 📁 Proje Yapısı

```
globalmenu/
├── client/                 # Frontend React uygulaması
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── services/      # API servisleri
│   │   ├── store/         # Zustand store
│   │   ├── App.jsx        # Ana uygulama
│   │   └── main.jsx       # Entry point
│   ├── public/            # Statik dosyalar
│   └── package.json
│
├── server/                # Backend Node.js API
│   ├── config/           # Yapılandırma dosyaları
│   ├── database/         # SQL şema ve seed
│   ├── routes/           # API route'lar
│   └── server.js         # Entry point
│
├── package.json          # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Restoranlar
- `GET /api/restaurants` - Restoranlarımızı listele
- `GET /api/restaurants/:slug` - Restoran detayı

### Ürünler
- `GET /api/products/restaurant/:restaurantId` - Restorana ait ürünler

### Siparişler
- `POST /api/orders` - Yeni sipariş oluştur
- `GET /api/orders/:orderNumber` - Sipariş detayı

### Health Check
- `GET /api/health` - API sağlık kontrolü

## 🎨 Tasarım Özellikleri

- **Renk Paleti**: 
  - Primary (Fuşya): #EC4899
  - Secondary (Yeşil): #22C55E
  - Dark (Siyah): #1F2937
- **Font**: Poppins (Google Fonts)
- **UI Bileşenleri**: Card, Modal, Floating Cart Button, Step Form
- **Responsive Breakpoints**: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)

## 📧 E-posta Yapılandırması

Sipariş bildirimleri için SMTP ayarları:

**Gmail için:**
1. Google hesabınızda 2FA aktif olmalı
2. App Password oluşturun
3. `.env` dosyasında `EMAIL_USER` ve `EMAIL_PASSWORD` ayarlayın

## 🔒 Güvenlik

- SQL Injection koruması (parametreli sorgular)
- XSS koruması (Helmet.js)
- Rate limiting (DDoS koruması)
- CORS yapılandırması
- Environment variables (.env)
- Input validasyonu

## 🐛 Debugging

### Backend Logları (PM2)

```bash
pm2 logs lila-menu-api
pm2 monit
```

### Veritabanı Bağlantı Testi

```bash
cd server
node -e "require('./config/database.js').getConnection().then(() => console.log('OK'))"
```

## 📝 Önemli Notlar

- Veritabanı **dış kaynakta** (Plesk içinde değil)
- Production'da `NODE_ENV=development` olmalı
- CORS ayarlarını production domain'e göre yapın
- E-posta SMTP bilgilerini doğru girin
- PM2 ile backend'i daemon olarak çalıştırın

## 🤝 Destek

Herhangi bir sorun için:
- E-posta: support@lilagroup.com
- Telefon: +90 555 123 45 67

## 📄 Lisans

Bu proje Lila Group için özel olarak geliştirilmiştir.

---

**Geliştirici Notu**: Production-quality, clean, semantic ve maintainable kod standartlarıyla geliştirilmiştir.

