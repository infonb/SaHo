import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3000,
    proxy: {
      // '/api': { target: 'http://192.168.2.24:8081', changeOrigin: true },
      // '/locations': { target: 'http://192.168.2.24:8081', changeOrigin: true },
      '/api': { target: 'http://localhost:8081', changeOrigin: true },
      '/locations': { target: 'http://localhost:8081', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
});
