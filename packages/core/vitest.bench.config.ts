import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['benchmarks/**/*.bench.ts'],
    benchmark: {
      outputFile: './benchmark-results.json',
      reporters: ['default', 'json']
    },
    environment: 'jsdom',
    globals: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@uusjs/core': resolve(__dirname, './src')
    }
  }
});