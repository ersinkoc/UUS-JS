import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@uusjs/core': path.resolve(__dirname, '../../packages/core/src')
    }
  }
});