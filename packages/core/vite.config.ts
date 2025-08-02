import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Uus',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        const formatMap = {
          es: 'index.js',
          cjs: 'index.cjs',
          umd: 'uus.min.js',
        };
        return formatMap[format] || 'index.js';
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
