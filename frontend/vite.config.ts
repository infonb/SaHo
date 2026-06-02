import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': path.resolve(dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/locations': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
