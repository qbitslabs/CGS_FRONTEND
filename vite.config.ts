/* Vite config for the clinic staff dashboard (port 3000).
 * Proxies /cgs_api to the local CGS backend during development. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      '/cgs_api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/w_api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
});

