import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [react()],
    publicDir: 'assets',
    resolve: {
        alias: { '@': '/src' },
    },
    server: {
        port: 5173, proxy: {
            '/api': 
            // { target: 'http://localhost:3000', changeOrigin: true }, 
            { target: 'https://testcmsapi.dghub.io', changeOrigin: true },
            '/images': 
            //{ target: 'http://localhost:3000', changeOrigin: true }
            { target: 'https://testcmsapi.dghub.io', changeOrigin: true }
        }
    },
});
