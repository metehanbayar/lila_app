import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { getConnection, closeConnection } from './config/database.js';
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
import adminUsersRouter from './routes/admin-users.js';
import customerAuthRouter from './routes/customer-auth.js';
import customerOrdersRouter from './routes/customer-orders.js';
import customerAddressesRouter from './routes/customer-addresses.js';
import couponsRouter from './routes/coupons.js';
import geocodeRouter from './routes/geocode.js';
import otpRouter from './routes/otp.js';
import testEmailRouter from './routes/test-email.js';
import paymentRouter from './routes/payment.js';
import { initializeSocketIO } from './services/socket-service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
let server; // HTTP server referansı; graceful shutdown için

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);
// Body parser - Büyük dosyalar için limit artırıldı
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static dosya servisi - Yüklenen görseller için
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - Development ortamında daha esnek, production'da katı
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Production: 100, Dev: 1000
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Sadece production ortamında rate limiting uygula
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
  console.log('🛡️  Rate limiting aktif (Production mode)');
} else {
  console.log('⚠️  Rate limiting devre dışı (Development mode)');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lila Group Menu API çalışıyor',
    timestamp: new Date().toISOString(),
  });
});

// Public API Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/geocode', geocodeRouter);

// Admin API Routes
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
app.use('/api/admin/users', adminUsersRouter);

// Customer API Routes
app.use('/api/customer', customerAuthRouter);
app.use('/api/customer', customerOrdersRouter);
app.use('/api/customer/addresses', customerAddressesRouter);

// OTP API Routes
app.use('/api/otp', otpRouter);

// Coupon API Routes
app.use('/api/coupons', couponsRouter);

// Payment API Routes
app.use('/api/payment', paymentRouter);

// Email Test Routes
app.use('/api/test-email', testEmailRouter);

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

// Sunucuyu başlat
async function startServer() {
  try {
    // Veritabanı bağlantısını test et (geçici olarak devre dışı)
    try {
      await getConnection();
    } catch (dbError) {
      console.log('⚠️  Veritabanı bağlantısı başarısız, devam ediliyor...');
      console.log('Veritabanı hatası:', dbError.message);
    }

    // Socket.IO'yu başlat
    initializeSocketIO(httpServer);

    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Lila Group Menu API çalışıyor`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Ağdan erişim için: http://<YEREL-IP>:${PORT}`);
      console.log(`\n📡 Public Endpoints:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/restaurants`);
      console.log(`   GET  /api/restaurants/:slug`);
      console.log(`   GET  /api/products/restaurant/:restaurantId`);
      console.log(`   POST /api/orders`);
      console.log(`   GET  /api/orders/:orderNumber`);
      console.log(`   GET  /api/geocode/reverse`);
      console.log(`\n💳 Payment Endpoints:`);
      console.log(`   POST /api/payment/initialize`);
      console.log(`   POST /api/payment/callback/3d-secure`);
      console.log(`   GET  /api/payment/status/:transactionId`);
      console.log(`\n🔐 Admin Endpoints:`);
      console.log(`   POST /api/admin/login`);
      console.log(`   GET  /api/admin/dashboard/stats`);
      console.log(`   GET  /api/admin/dashboard/recent-orders`);
      console.log(`   *    /api/admin/restaurants (CRUD)`);
      console.log(`   *    /api/admin/categories (CRUD)`);
      console.log(`   *    /api/admin/products (CRUD)`);
      console.log(`   *    /api/admin/orders (CRUD)`);
      console.log(`   *    /api/admin/media (GET, POST, DELETE)`);
      console.log(`\n👤 Customer Endpoints:`);
      console.log(`   POST /api/customer/register (OTP ile)`);
      console.log(`   POST /api/customer/login (OTP ile)`);
      console.log(`   GET  /api/customer/profile`);
      console.log(`   PUT  /api/customer/profile`);
      console.log(`   GET  /api/customer/my-orders`);
      console.log(`   GET  /api/customer/my-orders/:orderNumber`);
      console.log(`   GET  /api/customer/statistics`);
      console.log(`   *    /api/customer/favorites (GET, POST, DELETE)`);
      console.log(`   *    /api/customer/addresses (GET, POST, PUT, DELETE)`);
      console.log(`\n📱 OTP Endpoints:`);
      console.log(`   POST /api/otp/send (SMS gönder)`);
      console.log(`   POST /api/otp/verify (OTP doğrula)`);
      console.log(`   DEL  /api/otp/cleanup (Temizleme)\n`);
    });
  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Sunucu kapatılıyor...');
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⏹️  Sunucu kapatılıyor...');
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeConnection();
  process.exit(0);
});

startServer();

