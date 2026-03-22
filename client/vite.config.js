import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = (env.VITE_PROXY_TARGET || 'http://localhost:3300').replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      hmr: {
        overlay: false,
        host: 'localhost',
      },
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          timeout: 10000,
          secure: false,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          timeout: 10000,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
      exclude: ['@react-google-maps/api'],
    },
  };
});
