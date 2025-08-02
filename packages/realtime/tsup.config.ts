import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    websocket: 'src/websocket.ts',
    sse: 'src/sse.ts',
  },
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['@uusjs/core', 'socket.io-client', 'ws'],
});
