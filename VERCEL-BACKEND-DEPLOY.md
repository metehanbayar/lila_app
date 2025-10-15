# 🚀 Hem Frontend Hem Backend Vercel'de Deploy

## ⚡ Tüm Uygulama Tek Platformda!

Hem frontend hem backend'i **Vercel'de ücretsiz** çalıştırabilirsiniz!

---

## 🎯 Mimari

```
Vercel Project
├── /client (Frontend - Vite/React)
└── /api (Backend - Serverless Functions)
```

Vercel otomatik olarak:
- `client/` klasörünü static site olarak build eder
- `api/` klasöründeki dosyaları serverless functions olarak çalıştırır

---

## 📝 Gerekli Değişiklikler

### 1️⃣ Vercel Yapılandırması

`vercel.json` dosyası (root'ta):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2️⃣ Backend Entry Point (Serverless)

`server/index.js` dosyası oluşturun (Vercel için):

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { getConnection } from './config/database.js';

// Route imports
import restaurantsRouter from './routes/restaurants.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import adminRestaurantsRouter from './routes/admin-restaurants.js';
import adminCategoriesRouter from './routes/admin-categories.js';
import adminProductsRouter from './routes/admin-products.js';
import adminOrdersRouter from './routes/admin-orders.js';
import adminMediaRouter from './routes/admin-media.js';
import adminProductVariantsRouter from './routes/admin-product-variants.js';
import adminImportRouter from './routes/admin-import.js';
import adminCouponsRouter from './routes/admin-coupons.js';
import adminReceiptTemplatesRouter from './routes/admin-receipt-templates.js';
import customerAuthRouter from './routes/customer-auth.js';
import customerOrdersRouter from './routes/customer-orders.js';
import customerAddressesRouter from './routes/customer-addresses.js';
import couponsRouter from './routes/coupons.js';
import geocodeRouter from './routes/geocode.js';
import otpRouter from './routes/otp.js';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lila Group Menu API çalışıyor (Vercel Serverless)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/restaurants', adminRestaurantsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/product-variants', adminProductVariantsRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/admin/import', adminImportRouter);
app.use('/api/admin/coupons', adminCouponsRouter);
app.use('/api/admin/receipt-templates', adminReceiptTemplatesRouter);
app.use('/api/customer', customerAuthRouter);
app.use('/api/customer', customerOrdersRouter);
app.use('/api/customer/addresses', customerAddressesRouter);
app.use('/api/otp', otpRouter);
app.use('/api/coupons', couponsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Vercel serverless export
export default app;
```

### 3️⃣ Frontend Build Script

`client/package.json` içinde:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🚀 Deployment Adımları

### 1. GitHub'a Push

```bash
git add .
git commit -m "Vercel deployment yapılandırması"
git push origin main
```

### 2. Vercel'e Bağlan

1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. **"New Project"** butonuna tıklayın
3. GitHub repo'nuzu seçin: `globalmenu`
4. **Framework Preset**: `Other` seçin
5. **Root Directory**: `.` (boş bırakın - root)

### 3. Environment Variables Ekleyin

Vercel Dashboard'da **Environment Variables** bölümüne:

```
# Database (MSSQL - kendi sunucunuz)
DB_SERVER = your-server.database.windows.net
DB_PORT = 1433
DB_DATABASE = LilaGroupMenu
DB_USER = your_username
DB_PASSWORD = your_password
DB_ENCRYPT = true

# Email
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password
EMAIL_FROM = noreply@lilagroup.com
EMAIL_TO = orders@lilagroup.com

# CORS - Vercel otomatik domain kullanacak
CORS_ORIGIN = https://your-project.vercel.app

# Node
NODE_ENV = production
```

> ⚠️ **ÖNEMLİ**: MSSQL sunucunuzun Vercel'in IP'lerinden erişilebilir olması gerekir!
> Azure SQL kullanıyorsanız, Firewall'da "Allow Azure Services" açın.

### 4. Deploy

**"Deploy"** butonuna tıklayın!

---

## 🎉 Tamamlandı!

Uygulamanız şu adreste:
- **Frontend + Backend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api`

---

## ⚠️ Sınırlamalar (Vercel Free Plan)

| Özellik | Limit |
|---------|-------|
| Serverless Function Timeout | 10 saniye |
| Bandwidth | 100 GB/ay |
| Serverless Function Size | 50 MB |
| Invocations | 100,000/ay |

**Çoğu restoran uygulaması için yeterlidir!**

---

## 🔄 Socket.IO Alternatifi (Real-time Siparişler)

Socket.IO yerine **polling** kullanın:

```javascript
// Admin panelinde her 5 saniyede bir yeni siparişleri kontrol et
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/admin/orders/new')
      .then(res => res.json())
      .then(data => {
        // Yeni siparişleri göster
      });
  }, 5000); // 5 saniye

  return () => clearInterval(interval);
}, []);
```

Veya **Vercel Cron Jobs** kullanın (ücretsiz):

```json
// vercel.json içinde
{
  "crons": [
    {
      "path": "/api/cron/check-orders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 📤 File Upload Sorunu

Vercel serverless functions **kalıcı dosya sistemi yoktur**. Çözüm:

### Cloudinary (Önerilen - Ücretsiz)

```bash
npm install cloudinary
```

```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload
const result = await cloudinary.uploader.upload(file.path);
```

**Veya AWS S3, Vercel Blob Storage kullanabilirsiniz.**

---

## ✅ Test

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Restaurants
curl https://your-project.vercel.app/api/restaurants
```

---

## 🔄 Güncelleme

Her GitHub push otomatik deploy eder!

```bash
git add .
git commit -m "Update"
git push origin main
# Vercel otomatik deploy başlatır
```

---

## 💡 Pro İpuçları

1. **Preview Deployments**: Her branch otomatik önizleme URL'si alır
2. **Analytics**: Vercel Analytics ücretsiz
3. **Custom Domain**: Kendi domain'inizi ücretsiz bağlayın
4. **Edge Functions**: Daha hızlı yanıt için edge kullanın

---

## 🎯 Sonuç

Vercel ile:
- ✅ Hem frontend hem backend aynı yerde
- ✅ Tamamen ücretsiz (küçük-orta ölçek)
- ✅ Otomatik SSL
- ✅ Global CDN
- ✅ Git ile otomatik deploy

**MSSQL kendi sunucunuzda olduğu sürece sorun yok!**

