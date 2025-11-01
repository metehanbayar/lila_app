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
    https: true, // HTTPS'i aktif et
    host: '0.0.0.0', // Ağdan erişim için
    port: 5173,
    hmr: {
      overlay: false, // HMR overlay'ini kapat - performans için
    },
    watch: {
      usePolling: false, // Polling'i kapat - performans için
      ignored: ['**/node_modules/**', '**/.git/**'], // Gereksiz dosyaları izleme
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 10000, // Timeout ekle
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 10000, // Timeout ekle
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


