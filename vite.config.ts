import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: proxy /api to the Azure Functions host started by `func start` (or SWA CLI).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
});
