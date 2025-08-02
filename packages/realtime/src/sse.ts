import { createReactive as reactive } from '@uusjs/core';
import type { SSEOptions, RealtimeConnection, RealtimeMessage } from './types';

/**
 * Create a Server-Sent Events connection
 */
export function createSSE(options: SSEOptions = {}): RealtimeConnection {
  let eventSource: EventSource | null = null;
  let reconnectTimer: any = null;

  const state = reactive({
    connected: false,
    connecting: false,
  });

  const listeners = new Map<string, Set<Function>>();

  // Default options
  const opts = {
    url: options.url || `/sse`,
    retry: options.retry || 3000,
    withCredentials: options.withCredentials || false,
    reconnect: {
      enabled: true,
      delay: 1000,
      maxDelay: 30000,
      attempts: Infinity,
      ...options.reconnect,
    },
    debug: options.debug || false,
  };

  function log(...args: any[]) {
    if (opts.debug) {
      console.log('[SSE]', ...args);
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
      const url = new URL(opts.url, window.location.origin);
      Object.entries(authData).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });

      // Create EventSource with custom headers via fetch if needed
      if (options.headers && Object.keys(options.headers).length > 0) {
        // Use fetch with ReadableStream for custom headers
        const response = await fetch(url.toString(), {
          headers: options.headers,
          credentials: opts.withCredentials ? 'include' : 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        // Process stream
        processStream(reader);
      } else {
        // Use standard EventSource
        eventSource = new EventSource(url.toString(), {
          withCredentials: opts.withCredentials,
        });

        setupEventSource();
      }
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

  function setupEventSource() {
    if (!eventSource) return;

    eventSource.onopen = () => {
      log('Connected');
      state.connected = true;
      state.connecting = false;
      emit('connect');
    };

    eventSource.onerror = (error) => {
      log('Error', error);
      state.connected = false;
      state.connecting = false;
      emit('error', error);

      if (opts.reconnect.enabled) {
        scheduleReconnect();
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        log('Message received', message);

        emit(message.event || 'message', message.data);
        emit('message', message);
      } catch (error) {
        // Handle plain text messages
        emit('message', event.data);
      }
    };

    // Listen for custom events
    listeners.forEach((_, event) => {
      if (
        event !== 'connect' &&
        event !== 'disconnect' &&
        event !== 'error' &&
        event !== 'message'
      ) {
        eventSource!.addEventListener(event, (e: any) => {
          try {
            const data = JSON.parse(e.data);
            emit(event, data);
          } catch {
            emit(event, e.data);
          }
        });
      }
    });
  }

  async function processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) {
    const decoder = new TextDecoder();
    let buffer = '';

    state.connected = true;
    state.connecting = false;
    emit('connect');

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const message = JSON.parse(data);
              emit(message.event || 'message', message.data);
              emit('message', message);
            } catch {
              emit('message', data);
            }
          } else if (line.startsWith('event: ')) {
            // Handle custom events
            const event = line.slice(7);
            // Next data line will be for this event
          }
        }
      }
    } catch (error) {
      log('Stream error', error);
      emit('error', error);
    } finally {
      state.connected = false;
      emit('disconnect');

      if (opts.reconnect.enabled) {
        scheduleReconnect();
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;

    const delay = opts.reconnect.delay;
    log(`Reconnecting in ${delay}ms`);

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

    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    state.connected = false;
    state.connecting = false;
    emit('disconnect');
  }

  function send(event: string, data?: any) {
    // SSE is read-only, so we need to use fetch for sending
    const url = new URL(opts.url, window.location.origin);

    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: opts.withCredentials ? 'include' : 'same-origin',
      body: JSON.stringify({ event, data }),
    }).catch((error) => {
      log('Failed to send message', error);
      emit('error', error);
    });
  }

  function on(event: string, handler: (data: any) => void): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());

      // Add event listener if EventSource exists
      if (
        eventSource &&
        event !== 'connect' &&
        event !== 'disconnect' &&
        event !== 'error' &&
        event !== 'message'
      ) {
        eventSource.addEventListener(event, (e: any) => {
          try {
            const data = JSON.parse(e.data);
            emit(event, data);
          } catch {
            emit(event, e.data);
          }
        });
      }
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

  // SSE doesn't support rooms natively
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
 * SSE directive for Uus.js
 * Usage: <div uus-sse:update="handleUpdate"></div>
 */
export const sseDirective = {
  name: 'sse',

  mounted(el: Element, binding: any, app: any) {
    const { value, arg } = binding;
    const connection = app.$sse as RealtimeConnection;

    if (!connection) {
      console.error('SSE not configured. Use app.use(sse) first.');
      return;
    }

    if (!arg) {
      console.error('Event name required: uus-sse:eventName');
      return;
    }

    // Subscribe to event
    const unsubscribe = connection.on(arg, (data) => {
      if (typeof value === 'function') {
        value(data);
      } else {
        // Update element content
        el.textContent = String(data);
      }
    });

    // Store unsubscribe function
    (el as any).__sseUnsubscribe = unsubscribe;
  },

  unmounted(el: Element) {
    const unsubscribe = (el as any).__sseUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      delete (el as any).__sseUnsubscribe;
    }
  },
};
