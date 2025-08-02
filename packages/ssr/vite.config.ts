import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UusSSR',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        '@uusjs/core',
        'jsdom',
        'path',
        'fs',
        'vm',
        'events',
        'url',
        'http',
        'https',
        'stream',
        'zlib',
        'util',
        'crypto',
        'os',
        'child_process',
        'net',
        'tls',
        'dns',
        'assert',
        'buffer',
        'querystring',
        'constants',
        'perf_hooks',
        'punycode',
      ],
      output: {
        globals: {
          '@uusjs/core': 'Uus',
        },
      },
    },
  },
});
