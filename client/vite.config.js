import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ mode }) => {
  // .env dosyasından değişkenleri yükle
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // NODE_ENV'i manuel olarak ayarla
    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
    },
    plugins: [
      react(),
      mkcert(), // SSL sertifikası otomatik oluşturur
    ],
  server: {
    // Development için HTTP kullanıyoruz (HTTPS production'da nginx üzerinden sağlanır)
    https: false, // Dev server için HTTP (self-signed sertifika sorunlarını önlemek için)
    host: '0.0.0.0', // Ağdan erişim için (tüm interface'lerden dinle)
    port: 5173,
    strictPort: false, // Port kullanılıyorsa otomatik farklı port dene
    hmr: {
      overlay: false, // HMR overlay'ini kapat - performans için
      host: 'localhost', // HMR için localhost kullan
    },
    watch: {
      usePolling: false, // Polling'i kapat - performans için
      ignored: ['**/node_modules/**', '**/.git/**'], // Gereksiz dosyaları izleme
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        timeout: 10000, // Timeout ekle
        secure: false, // SSL sertifikası kontrolünü atla
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        timeout: 10000, // Timeout ekle
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // esbuild daha hızlı ve Vite ile birlikte geliyor
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          maps: ['leaflet', 'react-leaflet', '@react-google-maps/api'],
          utils: ['axios', 'zustand'],
        },
      },
    },
    // Chunk size uyarılarını artır
    chunkSizeWarningLimit: 1000,
  },
  // Development optimizasyonları
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
    exclude: ['@react-google-maps/api'], // Bu kütüphane dinamik yükleniyor
  },
  };
});


