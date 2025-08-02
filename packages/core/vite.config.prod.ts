import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.prod.ts'),
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
      treeshake: {
        // Aggressive tree shaking
        preset: 'recommended',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },
      // External dependencies that can be provided by the consuming app
      external: (id) => {
        // Mark development-only modules as external in production
        if (id.includes('devtools') || id.includes('performance')) {
          return true;
        }
        return false;
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log and debugger statements
        drop_console: true,
        drop_debugger: true,
        // More aggressive compression
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        // Remove unused code
        dead_code: true,
        unused: true,
        // Optimize conditionals
        conditionals: true,
        evaluate: true,
        booleans: true,
        loops: true,
        // Join consecutive variable declarations
        join_vars: true,
        // Collapse single-use variables
        collapse_vars: true,
        // Reduce variable names
        reduce_vars: true,
        // Inline small functions
        inline: 3,
        // Remove unreachable code
        passes: 3,
      },
      mangle: {
        // Mangle all property names starting with underscore
        properties: {
          regex: /^_/
        },
        // Mangle top-level variable names
        toplevel: true,
      },
      format: {
        // Remove comments
        comments: false,
      },
    },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Smaller chunk size for better compression
    chunkSizeWarningLimit: 1000,
  },
  define: {
    // Replace development flags
    __DEV__: false,
    'process.env.NODE_ENV': '"production"',
  },
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});