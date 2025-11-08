import { createReactive as reactive } from '@uusjs/core';
import type {
  WebSocketOptions,
  RealtimeConnection,
  RealtimeMessage,
} from './types';

// Safe JSON parsing to prevent prototype pollution
function safeJsonParse(text: string): any {
  try {
    const parsed = JSON.parse(text);
    
    // Check for prototype pollution attempts
    if (parsed && typeof parsed === 'object') {
      const dangerous = ['__proto__', 'constructor', 'prototype'];
      
      // Recursive check for dangerous keys
      const checkObject = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') return true;
        
        for (const key of Object.keys(obj)) {
          if (dangerous.includes(key)) {
            console.error('[WebSocket] Potential prototype pollution detected');
            return false;
          }
          if (typeof obj[key] === 'object' && !checkObject(obj[key])) {
            return false;
          }
        }
        return true;
      };
      
      if (!checkObject(parsed)) {
        throw new Error('Unsafe JSON detected');
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('[WebSocket] JSON parse error:', error);
    throw error;
  }
}

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

  // Sanitize auth parameters to prevent injection attacks
  function sanitizeAuthParams(params: Record<string, any>): Record<string, string> {
    const safe: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      // Only allow alphanumeric keys with underscores and hyphens
      if (/^[a-zA-Z0-9_-]+$/.test(key)) {
        // Encode value to prevent injection
        safe[key] = encodeURIComponent(String(value));
      } else {
        console.warn(`[WebSocket] Skipping invalid auth parameter key: ${key}`);
      }
    }
    return safe;
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

      // Build URL with sanitized auth params
      const url = new URL(opts.url);
      const sanitizedAuth = sanitizeAuthParams(authData);
      Object.entries(sanitizedAuth).forEach(([key, value]) => {
        // Values are already encoded by sanitizeAuthParams
        url.searchParams.set(key, value);
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
          // Safe JSON parsing with validation
          const message: RealtimeMessage = safeJsonParse(event.data);
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
      connect().catch((error) => {
        log('Reconnection failed', error);
        // Will retry on next attempt if reconnect is still enabled
      });
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
      id: Math.random().toString(36).substring(2, 11),
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

    // BUG-NEW-025 FIX: Add timeout to prevent hanging promise
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for joined confirmation for room: ${room}`));
      }, 5000); // 5 second timeout

      once(`joined:${room}`, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  async function leave(room: string): Promise<void> {
    send('leave', { room });

    // BUG-NEW-025 FIX: Add timeout to prevent hanging promise
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for left confirmation for room: ${room}`));
      }, 5000); // 5 second timeout

      once(`left:${room}`, () => {
        clearTimeout(timeout);
        resolve();
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
