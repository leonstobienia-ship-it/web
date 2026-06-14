import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@enacSistema': path.resolve(__dirname, '../src/webparts/enacSistema')
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../dist-web'),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
