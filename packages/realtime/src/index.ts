import type { Uus } from '@uusjs/core';
import type {
  RealtimeOptions,
  RealtimePlugin,
  RealtimeConnection,
  WebSocketOptions,
  SSEOptions,
} from './types';
import { createWebSocket, wsDirective } from './websocket';
import { createSSE, sseDirective } from './sse';
import { createSocketIO, ioDirective } from './socketio';

export * from './types';
export * from './websocket';
export * from './sse';
export * from './socketio';
export * from './store';

/**
 * Create a real-time plugin for Uus.js
 */
export function createRealtime(
  type: 'websocket' | 'sse' | 'socketio',
  options: RealtimeOptions = {}
): RealtimePlugin {
  let connection: RealtimeConnection;

  switch (type) {
    case 'websocket':
      connection = createWebSocket(options as WebSocketOptions);
      break;

    case 'sse':
      connection = createSSE(options as SSEOptions);
      break;

    case 'socketio':
      connection = createSocketIO(options);
      break;

    default:
      throw new Error(`Unknown realtime type: ${type}`);
  }

  return {
    connection,

    install(app: Uus) {
      // Add connection to app
      (app as any)[`$${type === 'socketio' ? 'io' : type}`] = connection;

      // Auto-connect
      connection.connect().catch((error) => {
        console.error(`Failed to connect ${type}:`, error);
      });

      // Register directives
      switch (type) {
        case 'websocket':
          app.directive('ws', wsDirective);
          break;

        case 'sse':
          app.directive('sse', sseDirective);
          break;

        case 'socketio':
          app.directive('io', ioDirective);
          break;
      }

      // Add reactive connection state
      app.state.$realtime = {
        get connected() {
          return connection.connected;
        },
        get connecting() {
          return connection.connecting;
        },
      };
    },
  };
}

/**
 * WebSocket plugin factory
 */
export function websocket(options?: WebSocketOptions) {
  return createRealtime('websocket', options);
}

/**
 * SSE plugin factory
 */
export function sse(options?: SSEOptions) {
  return createRealtime('sse', options);
}

/**
 * Socket.io plugin factory
 */
export function socketio(options?: RealtimeOptions) {
  return createRealtime('socketio', options);
}
