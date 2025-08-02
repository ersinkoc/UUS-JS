import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['@uusjs/core'],
  esbuildOptions(options) {
    options.supported = {
      'dynamic-import': true,
    };
  },
  loader: {
    '.json': 'json',
  },
  ignoreWatch: ['**/locales/**'],
});
