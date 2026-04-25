import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Dev: proxy /api to local backend (has news/feed with imageUrl). Override to hit staging, e.g.:
//   VITE_DEV_API_PROXY=https://testcms.dghub.io npm run dev
// Client rewrites /api/... to /api/v1/... when VITE_API_USE_V1=true (see src/lib/api.ts).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiProxy = (env.VITE_DEV_API_PROXY || '').trim() || 'http://127.0.0.1:3000';
  const devImagesProxy = (env.VITE_DEV_IMAGES_PROXY || '').trim() || devApiProxy;

  return {
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
  };
});
