import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3030,
    proxy: {
      '/api': {
        target: 'https://darkblue-locust-891705.hostingersite.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
});
