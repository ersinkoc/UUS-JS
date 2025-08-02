import { createReactive as reactive } from '@uusjs/core';
import type {
  WebSocketOptions,
  RealtimeConnection,
  RealtimeMessage,
} from './types';

/**
 * Create a WebSocket connection
 */
export function createWebSocket(
  options: WebSocketOptions = {}
): RealtimeConnection {
  let ws: WebSocket | null = null;
  let reconnectTimer: any = null;
  let heartbeatTimer: any = null;
  let reconnectAttempts = 0;

  const state = reactive({
    connected: false,
    connecting: false,
  });

  const listeners = new Map<string, Set<Function>>();
  const messageQueue: RealtimeMessage[] = [];

  // Default options
  const opts = {
    url: options.url || `ws://${window.location.host}`,
    reconnect: {
      enabled: true,
      delay: 1000,
      maxDelay: 30000,
      attempts: Infinity,
      ...options.reconnect,
    },
    heartbeat: {
      interval: 30000,
      timeout: 60000,
      message: 'ping',
      ...options.heartbeat,
    },
    debug: options.debug || false,
  };

  function log(...args: any[]) {
    if (opts.debug) {
      console.log('[WebSocket]', ...args);
    }
  }

  function emit(event: string, data?: any) {
    const handlers = listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  function setupHeartbeat() {
    if (!opts.heartbeat.interval) return;

    clearInterval(heartbeatTimer);

    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        send('ping', opts.heartbeat.message);
        log('Heartbeat sent');
      }
    }, opts.heartbeat.interval);
  }

  function clearHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  async function connect(): Promise<void> {
    if (state.connected || state.connecting) return;

    state.connecting = true;

    try {
      // Get auth data if provided
      let authData = {};
      if (options.auth) {
        authData =
          typeof options.auth === 'function'
            ? await options.auth()
            : options.auth;
      }

      // Build URL with auth params
      const url = new URL(opts.url);
      Object.entries(authData).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });

      // Create WebSocket
      ws = new WebSocket(url.toString(), options.protocols);

      if (options.binaryType) {
        ws.binaryType = options.binaryType;
      }

      // Set up event handlers
      ws.onopen = () => {
        log('Connected');
        state.connected = true;
        state.connecting = false;
        reconnectAttempts = 0;

        // Send queued messages
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          if (msg) {
            send(msg.event, msg.data);
          }
        }

        setupHeartbeat();
        emit('connect');
      };

      ws.onclose = (event) => {
        log('Disconnected', event.code, event.reason);
        state.connected = false;
        state.connecting = false;
        clearHeartbeat();

        emit('disconnect', { code: event.code, reason: event.reason });

        // Reconnect if enabled
        if (
          opts.reconnect.enabled &&
          reconnectAttempts < opts.reconnect.attempts
        ) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        log('Error', error);
        emit('error', error);
      };

      ws.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          log('Message received', message);

          // Handle heartbeat
          if (message.event === 'pong') {
            log('Heartbeat acknowledged');
            return;
          }

          emit(message.event, message.data);
          emit('message', message);
        } catch (error) {
          log('Failed to parse message', event.data, error);
        }
      };
    } catch (error) {
      log('Connection failed', error);
      state.connecting = false;
      emit('error', error);

      if (opts.reconnect.enabled) {
        scheduleReconnect();
      }

      throw error;
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;

    reconnectAttempts++;
    const delay = Math.min(
      opts.reconnect.delay * Math.pow(2, reconnectAttempts - 1),
      opts.reconnect.maxDelay
    );

    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect().catch(() => {});
    }, delay);
  }

  function disconnect() {
    opts.reconnect.enabled = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    clearHeartbeat();

    if (ws) {
      ws.close();
      ws = null;
    }

    state.connected = false;
    state.connecting = false;
  }

  function send(event: string, data?: any) {
    const message: RealtimeMessage = {
      id: Math.random().toString(36).substr(2, 9),
      event,
      data,
      timestamp: Date.now(),
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      log('Message sent', message);
    } else {
      log('Queueing message', message);
      messageQueue.push(message);
    }
  }

  function on(event: string, handler: (data: any) => void): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => off(event, handler);
  }

  function once(event: string, handler: (data: any) => void): () => void {
    const wrapper = (data: any) => {
      handler(data);
      off(event, wrapper);
    };

    return on(event, wrapper);
  }

  function off(event: string, handler?: (data: any) => void) {
    if (!handler) {
      listeners.delete(event);
    } else {
      const handlers = listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          listeners.delete(event);
        }
      }
    }
  }

  async function join(room: string): Promise<void> {
    send('join', { room });

    return new Promise((resolve) => {
      once(`joined:${room}`, resolve);
    });
  }

  async function leave(room: string): Promise<void> {
    send('leave', { room });

    return new Promise((resolve) => {
      once(`left:${room}`, resolve);
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
 * WebSocket directive for Uus.js
 * Usage: <div uus-ws:message="handleMessage"></div>
 */
export const wsDirective = {
  name: 'ws',

  mounted(el: Element, binding: any, app: any) {
    const { value, arg } = binding;
    const connection = app.$ws as RealtimeConnection;

    if (!connection) {
      console.error('WebSocket not configured. Use app.use(websocket) first.');
      return;
    }

    if (!arg) {
      console.error('Event name required: uus-ws:eventName');
      return;
    }

    // Subscribe to event
    const unsubscribe = connection.on(arg, (data) => {
      if (typeof value === 'function') {
        value(data);
      }
    });

    // Store unsubscribe function
    (el as any).__wsUnsubscribe = unsubscribe;
  },

  unmounted(el: Element) {
    const unsubscribe = (el as any).__wsUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      delete (el as any).__wsUnsubscribe;
    }
  },
};
