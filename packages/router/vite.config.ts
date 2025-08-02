import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'UusRouter',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        const formatMap = {
          es: 'index.js',
          cjs: 'index.cjs'
        };
        return formatMap[format] || 'index.js';
      }
    },
    rollupOptions: {
      external: ['@uusjs/core'],
      output: {
        exports: 'named',
        globals: {
          '@uusjs/core': 'Uus'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});