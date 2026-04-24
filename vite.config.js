import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// Dev: proxy /api to local backend (has news/feed with imageUrl). Override to hit staging, e.g.:
//   VITE_DEV_API_PROXY=https://testcmsapi.dghub.io npm run dev
var devApiProxy = (process.env.VITE_DEV_API_PROXY || '').trim() || 'http://127.0.0.1:3000';
var devImagesProxy = (process.env.VITE_DEV_IMAGES_PROXY || '').trim() || devApiProxy;
export default defineConfig({
    plugins: [react()],
    publicDir: 'assets',
    resolve: {
        alias: { '@': '/src' },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': { target: devApiProxy, changeOrigin: true },
            '/images': { target: devImagesProxy, changeOrigin: true },
        },
    },
});
