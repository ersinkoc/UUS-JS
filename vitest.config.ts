import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      include: ['packages/core/src/**/*.ts'],
      thresholds: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/__tests__/**',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
        'examples/**',
        'coverage/**',
        'packages/core/src/devtools.ts',
        'packages/core/src/performance.ts',
        'packages/core/src/test-build.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@uusjs/core': resolve(__dirname, './packages/core/src'),
      '@uusjs/router': resolve(__dirname, './packages/router/src'),
      '@uusjs/animate': resolve(__dirname, './packages/animate/src'),
      '@uusjs/forms': resolve(__dirname, './packages/forms/src'),
      '@uusjs/ssr': resolve(__dirname, './packages/ssr/src'),
      '@uusjs/realtime': resolve(__dirname, './packages/realtime/src'),
      '@uusjs/cli': resolve(__dirname, './packages/cli/src'),
      '@uusjs/i18n': resolve(__dirname, './packages/i18n/src'),
    },
  },
});
