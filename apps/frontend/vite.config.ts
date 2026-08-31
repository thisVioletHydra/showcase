import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(rootDir, 'src');
const githubPages = process.env.GITHUB_PAGES === 'true';

const subpaths = ['api', 'components', 'data', 'hooks', 'pages', 'styles', 'types'] as const;

const alias = Object.fromEntries([
  ['@', srcDir],
  ...subpaths.map((name) => [`@/${name}`, path.resolve(srcDir, name)]),
]);

export default defineConfig({
  base: githubPages ? '/showcase/' : '/',
  plugins: [react()],
  resolve: { alias },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/webhook': 'http://localhost:3000',
    },
  },
});
