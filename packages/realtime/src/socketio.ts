import { createReactive as reactive } from '@uusjs/core';
import type {
  RealtimeOptions,
  RealtimeConnection,
  RealtimeMessage,
} from './types';

// Socket.io client type (will be provided by peer dependency)
interface SocketIOClient {
  connected: boolean;
  connect(): void;
  disconnect(): void;
  emit(event: string, ...args: any[]): void;
  on(event: string, handler: Function): void;
  once(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
  join(room: string): void;
  leave(room: string): void;
}

interface SocketIOOptions extends RealtimeOptions {
  /**
   * Socket.io specific options
   */
  socketOptions?: any;
}

/**
 * Create a Socket.io connection
 */
export function createSocketIO(
  options: SocketIOOptions = {}
): RealtimeConnection {
  let io: any;
  let socket: SocketIOClient | null = null;

  const state = reactive({
    connected: false,
    connecting: false,
  });

  // Default options
  const opts = {
    url: options.url || `http://${window.location.host}`,
    reconnect: {
      enabled: true,
      delay: 1000,
      maxDelay: 30000,
      attempts: Infinity,
      ...options.reconnect,
    },
    transports: options.transports || ['websocket', 'polling'],
    debug: options.debug || false,
    socketOptions: options.socketOptions || {},
  };

  function log(...args: any[]) {
    if (opts.debug) {
      console.log('[Socket.io]', ...args);
    }
  }

  async function loadSocketIO(): Promise<any> {
    // Check if Socket.io is already loaded
    if ((window as any).io) {
      return (window as any).io;
    }

    // Try to import Socket.io client
    try {
      const module = await import('socket.io-client');
      return module.io || module.default;
    } catch (error) {
      throw new Error(
        'Socket.io client not found. Install it with: npm install socket.io-client'
      );
    }
  }

  async function connect(): Promise<void> {
    if (state.connected || state.connecting) return;

    state.connecting = true;

    try {
      // Load Socket.io
      io = await loadSocketIO();

      // Get auth data if provided
      let auth = {};
      if (options.auth) {
        auth =
          typeof options.auth === 'function'
            ? await options.auth()
            : options.auth;
      }

      // Create socket connection
      socket = io(opts.url, {
        reconnection: opts.reconnect.enabled,
        reconnectionDelay: opts.reconnect.delay,
        reconnectionDelayMax: opts.reconnect.maxDelay,
        reconnectionAttempts: opts.reconnect.attempts,
        transports: opts.transports,
        auth,
        ...opts.socketOptions,
      });

      // Set up event handlers
      socket.on('connect', () => {
        log('Connected');
        state.connected = true;
        state.connecting = false;
      });

      socket.on('disconnect', (reason: string) => {
        log('Disconnected', reason);
        state.connected = false;
        state.connecting = false;
      });

      socket.on('connect_error', (error: any) => {
        log('Connection error', error);
        state.connecting = false;
      });

      socket.on('error', (error: any) => {
        log('Error', error);
      });

      // Connect
      socket.connect();
    } catch (error) {
      log('Failed to connect', error);
      state.connecting = false;
      throw error;
    }
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    state.connected = false;
    state.connecting = false;
  }

  function send(event: string, data?: any) {
    if (!socket) {
      log('Not connected');
      return;
    }

    socket.emit(event, data);
    log('Message sent', event, data);
  }

  function on(event: string, handler: (data: any) => void): () => void {
    if (!socket) {
      log('Not connected');
      return () => {};
    }

    socket.on(event, handler);

    // Return unsubscribe function
    return () => off(event, handler);
  }

  function once(event: string, handler: (data: any) => void): () => void {
    if (!socket) {
      log('Not connected');
      return () => {};
    }

    socket.once(event, handler);

    // Return unsubscribe function
    return () => off(event, handler);
  }

  function off(event: string, handler?: (data: any) => void) {
    if (!socket) return;

    if (handler) {
      socket.off(event, handler);
    } else {
      socket.off(event);
    }
  }

  async function join(room: string): Promise<void> {
    if (!socket) {
      throw new Error('Not connected');
    }

    return new Promise((resolve, reject) => {
      socket!.emit('join', room, (error?: any) => {
        if (error) {
          reject(error);
        } else {
          log('Joined room', room);
          resolve();
        }
      });
    });
  }

  async function leave(room: string): Promise<void> {
    if (!socket) {
      throw new Error('Not connected');
    }

    return new Promise((resolve, reject) => {
      socket!.emit('leave', room, (error?: any) => {
        if (error) {
          reject(error);
        } else {
          log('Left room', room);
          resolve();
        }
      });
    });
  }

  return {
    get connected() {
      return state.connected;
    },
    get connecting() {
      return state.connecting;
    },
    connect,
    disconnect,
    send,
    on,
    once,
    off,
    join,
    leave,
  };
}

/**
 * Socket.io directive for Uus.js
 * Usage: <div uus-io:chat="handleMessage"></div>
 */
export const ioDirective = {
  name: 'io',

  mounted(el: Element, binding: any, app: any) {
    const { value, arg } = binding;
    const connection = app.$io as RealtimeConnection;

    if (!connection) {
      console.error('Socket.io not configured. Use app.use(socketio) first.');
      return;
    }

    if (!arg) {
      console.error('Event name required: uus-io:eventName');
      return;
    }

    // Subscribe to event
    const unsubscribe = connection.on(arg, (data) => {
      if (typeof value === 'function') {
        value(data);
      }
    });

    // Store unsubscribe function
    (el as any).__ioUnsubscribe = unsubscribe;
  },

  unmounted(el: Element) {
    const unsubscribe = (el as any).__ioUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      delete (el as any).__ioUnsubscribe;
    }
  },
};
