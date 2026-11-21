import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local development: /api calls backend (localhost:5000) par jaati hain
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
