import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@uusjs/core': path.resolve(__dirname, '../../packages/core/src')
    }
  }
});