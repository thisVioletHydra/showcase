import process from 'node:process';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const githubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: githubPages ? '/showcase/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/webhook': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
