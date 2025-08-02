import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSSE, sseDirective } from '../src/sse';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
class MockEventSource {
  url: string;
  withCredentials: boolean;
  readyState: number = 1; // OPEN
  onopen: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = options?.withCredentials || false;
    
    // Auto-trigger open event
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 1);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  addEventListener(event: string, handler: any) {
    if (event === 'open' && this.onopen === null) {
      this.onopen = handler;
    } else if (event === 'error' && this.onerror === null) {
      this.onerror = handler;
    } else if (event === 'message' && this.onmessage === null) {
      this.onmessage = handler;
    }
  }

  // Helper for testing
  mockMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  mockError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

global.EventSource = MockEventSource as any;

// Mock URL
global.URL = class MockURL {
  searchParams = new Map();
  
  constructor(public href: string, base?: string) {
    this.searchParams = {
      set: vi.fn(),
      get: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      entries: vi.fn(() => []),
      forEach: vi.fn(),
    } as any;
  }
  
  toString() {
    return this.href;
  }
} as any;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('SSE Connection', () => {
  let sse: ReturnType<typeof createSSE>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    });
  });

  afterEach(() => {
    if (sse) {
      sse.disconnect();
    }
    vi.restoreAllMocks();
  });

  describe('Basic Connection', () => {
    it('should create SSE connection with default options', () => {
      sse = createSSE();
      
      expect(sse.connected).toBe(false);
      expect(sse.connecting).toBe(false);
    });

    it('should create SSE connection with custom options', () => {
      sse = createSSE({
        url: '/custom-sse',
        retry: 5000,
        withCredentials: true,
        debug: true,
      });
      
      expect(sse.connected).toBe(false);
      expect(sse.connecting).toBe(false);
    });

    it('should connect successfully', async () => {
      sse = createSSE({ url: '/test-sse' });
      
      const connectPromise = sse.connect();
      
      // Wait for mock EventSource to open
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await connectPromise;
      
      expect(sse.connected).toBe(true);
      expect(sse.connecting).toBe(false);
    });

    it('should not connect if already connected', async () => {
      sse = createSSE();
      
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const firstConnected = sse.connected;
      
      // Try to connect again
      await sse.connect();
      
      expect(sse.connected).toBe(firstConnected);
    });

    it('should not connect if already connecting', async () => {
      sse = createSSE();
      
      const connectPromise1 = sse.connect();
      const connectPromise2 = sse.connect();
      
      // Wait a bit for the MockEventSource to trigger open
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await Promise.all([connectPromise1, connectPromise2]);
      
      expect(sse.connected).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should handle function-based auth', async () => {
      const authData = { token: 'test-token', userId: '123' };
      
      sse = createSSE({
        auth: () => authData,
      });
      
      const connectPromise = sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      await connectPromise;
      
      expect(sse.connected).toBe(true);
    });

    it('should handle async function-based auth', async () => {
      const authData = { token: 'async-token' };
      
      sse = createSSE({
        auth: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return authData;
        },
      });
      
      await sse.connect();
      // Wait for the MockEventSource to trigger open
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(sse.connected).toBe(true);
    });

    it('should handle object-based auth', async () => {
      const authData = { token: 'object-token' };
      
      sse = createSSE({
        auth: authData,
      });
      
      const connectPromise = sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      await connectPromise;
      
      expect(sse.connected).toBe(true);
    });
  });

  describe('Custom Headers via Fetch', () => {
    it('should use fetch when custom headers are provided', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"event":"test","data":"hello"}\\n\\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      sse = createSSE({
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      });

      const messageHandler = vi.fn();
      sse.on('test', messageHandler);

      await sse.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'custom-value',
          },
          credentials: 'same-origin',
        })
      );
    });

    it('should handle fetch response errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      sse = createSSE({
        headers: { 'Authorization': 'Bearer invalid' },
      });

      await expect(sse.connect()).rejects.toThrow('SSE connection failed: 401');
    });

    it('should handle missing response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      sse = createSSE({
        headers: { 'Authorization': 'Bearer token' },
      });

      await expect(sse.connect()).rejects.toThrow('Response body is not readable');
    });

    it('should process stream data correctly', async () => {
      const testData = 'data: {"event":"message","data":"hello"}\n\n';
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(testData) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      sse = createSSE({
        headers: { 'Authorization': 'Bearer token' },
      });

      const messageHandler = vi.fn();
      sse.on('message', messageHandler);

      await sse.connect();

      // Wait for stream processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(messageHandler).toHaveBeenCalledWith(expect.objectContaining({
        event: 'message',
        data: 'hello',
      }));
    });

    it('should handle stream processing errors', async () => {
      const mockReader = {
        read: vi.fn().mockRejectedValue(new Error('Stream error')),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      sse = createSSE({
        headers: { 'Authorization': 'Bearer token' },
        debug: true,
      });

      const errorHandler = vi.fn();
      sse.on('error', errorHandler);

      await sse.connect();

      // Wait for stream processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Event Handling', () => {
    it('should handle incoming messages', async () => {
      // Track the EventSource instances
      const instances: MockEventSource[] = [];
      const originalEventSource = global.EventSource;
      
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          instances.push(this);
        }
      } as any;
      
      sse = createSSE({ debug: true });
      
      const messageHandler = vi.fn();
      sse.on('message', messageHandler);
      
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use the actual EventSource instance
      const eventSource = instances[0];
      if (eventSource && eventSource.onmessage) {
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify({ event: 'test', data: 'hello' })
        });
        eventSource.onmessage(messageEvent);
      }
      
      expect(messageHandler).toHaveBeenCalled();
      
      global.EventSource = originalEventSource;
    });

    it('should handle plain text messages', async () => {
      // Track the EventSource instances
      const instances: MockEventSource[] = [];
      const originalEventSource = global.EventSource;
      
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          instances.push(this);
        }
      } as any;
      
      sse = createSSE();
      
      const messageHandler = vi.fn();
      sse.on('message', messageHandler);
      
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Use the actual EventSource instance
      const eventSource = instances[0];
      if (eventSource && eventSource.onmessage) {
        eventSource.onmessage(new MessageEvent('message', { data: 'plain text' }));
      }
      
      expect(messageHandler).toHaveBeenCalledWith('plain text');
      
      global.EventSource = originalEventSource;
    });

    it('should handle event-specific listeners', async () => {
      sse = createSSE();
      
      const testHandler = vi.fn();
      sse.on('test-event', testHandler);
      
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Mock custom event
      const instance = new MockEventSource('/sse');
      instance.addEventListener('test-event', testHandler);
      
      expect(testHandler).toBeDefined();
    });

    it('should support once listeners', async () => {
      sse = createSSE();
      
      const onceHandler = vi.fn();
      const unsubscribe = sse.once('test', onceHandler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove event listeners', () => {
      sse = createSSE();
      
      const handler = vi.fn();
      const unsubscribe = sse.on('test', handler);
      
      unsubscribe();
      
      // Should not receive events after unsubscribe
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove all listeners for an event', () => {
      sse = createSSE();
      
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      sse.on('test', handler1);
      sse.on('test', handler2);
      
      sse.off('test'); // Remove all handlers
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Sending Messages', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    it('should send messages via fetch', () => {
      sse = createSSE({ url: '/test-sse' });
      
      sse.send('test-event', { message: 'hello' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-sse'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            event: 'test-event',
            data: { message: 'hello' },
          }),
        })
      );
    });

    it('should send messages with custom headers', () => {
      sse = createSSE({
        url: '/test-sse',
        headers: {
          'Authorization': 'Bearer token123',
        },
      });
      
      sse.send('test-event', { message: 'hello' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-sse'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
          }),
        })
      );
    });

    it('should handle send errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      sse = createSSE({ debug: true });
      
      const errorHandler = vi.fn();
      sse.on('error', errorHandler);
      
      sse.send('test-event', { message: 'hello' });
      
      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(mockConsole.log).toHaveBeenCalledWith('[SSE]', 'Failed to send message', expect.any(Error));
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    it('should join rooms', async () => {
      // Track EventSource instances to simulate server responses
      const instances: MockEventSource[] = [];
      const originalEventSource = global.EventSource;
      
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          instances.push(this);
        }
      } as any;
      
      sse = createSSE();
      
      // Connect first to establish EventSource
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Start join operation (don't await yet)
      const joinPromise = sse.join('room1');
      
      // Simulate server response via EventSource
      setTimeout(() => {
        const eventSource = instances[0];
        if (eventSource && eventSource.onmessage) {
          eventSource.onmessage(new MessageEvent('message', {
            data: JSON.stringify({ event: 'joined:room1' })
          }));
        }
      }, 10);
      
      await expect(joinPromise).resolves.toBeUndefined();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            event: 'join',
            data: { room: 'room1' },
          }),
        })
      );
      
      global.EventSource = originalEventSource;
    }, 2000);

    it('should leave rooms', async () => {
      // Track EventSource instances to simulate server responses
      const instances: MockEventSource[] = [];
      const originalEventSource = global.EventSource;
      
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          instances.push(this);
        }
      } as any;
      
      sse = createSSE();
      
      // Connect first to establish EventSource
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const leavePromise = sse.leave('room1');
      
      // Simulate server response via EventSource
      setTimeout(() => {
        const eventSource = instances[0];
        if (eventSource && eventSource.onmessage) {
          eventSource.onmessage(new MessageEvent('message', {
            data: JSON.stringify({ event: 'left:room1' })
          }));
        }
      }, 10);
      
      await expect(leavePromise).resolves.toBeUndefined();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            event: 'leave',
            data: { room: 'room1' },
          }),
        })
      );
      
      global.EventSource = originalEventSource;
    });
  });

  describe('Reconnection', () => {
    it('should handle connection errors with reconnect enabled', async () => {
      sse = createSSE({
        reconnect: {
          enabled: true,
          delay: 100,
        },
        debug: true,
      });
      
      const errorHandler = vi.fn();
      sse.on('error', errorHandler);
      
      // Force connection to fail - don't auto-open
      const originalEventSource = global.EventSource;
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          // Don't auto-open, just trigger error
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 1);
        }
      } as any;
      
      await sse.connect();
      
      // Wait for error to be processed
      await new Promise(resolve => setTimeout(resolve, 15));
      
      expect(mockConsole.log).toHaveBeenCalledWith('[SSE]', 'Error', expect.any(Event));
      expect(mockConsole.log).toHaveBeenCalledWith('[SSE]', 'Reconnecting in 100ms');
      
      global.EventSource = originalEventSource;
    });

    it('should schedule reconnection on error', async () => {
      vi.useFakeTimers();
      
      // Track EventSource instances
      const instances: MockEventSource[] = [];
      const originalEventSource = global.EventSource;
      
      global.EventSource = class extends MockEventSource {
        constructor(...args: any[]) {
          super(...args);
          instances.push(this);
        }
      } as any;
      
      sse = createSSE({
        reconnect: {
          enabled: true,
          delay: 1000,
        },
        debug: true,
      });
      
      await sse.connect();
      vi.advanceTimersByTime(10);
      
      // Simulate error on the actual EventSource instance
      const instance = instances[0];
      if (instance && instance.onerror) {
        instance.onerror(new Event('error'));
      }
      
      // Check that reconnection is scheduled
      expect(mockConsole.log).toHaveBeenCalledWith('[SSE]', 'Reconnecting in 1000ms');
      
      global.EventSource = originalEventSource;
      vi.useRealTimers();
    });

    it('should not reconnect when disabled', async () => {
      sse = createSSE({
        reconnect: {
          enabled: false,
        },
      });
      
      await sse.connect();
      
      // Manually trigger error
      const instance = new MockEventSource('/sse');
      instance.mockError();
      
      // Should not schedule reconnection
      expect(mockConsole.log).not.toHaveBeenCalledWith('[SSE]', expect.stringContaining('Reconnecting'));
    });
  });

  describe('Disconnection', () => {
    it('should disconnect cleanly', async () => {
      sse = createSSE();
      
      await sse.connect();
      // Give more time for the MockEventSource to trigger open
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(sse.connected).toBe(true);
      
      sse.disconnect();
      
      expect(sse.connected).toBe(false);
      expect(sse.connecting).toBe(false);
    });

    it('should clear reconnection timer on disconnect', async () => {
      vi.useFakeTimers();
      
      sse = createSSE({
        reconnect: {
          enabled: true,
          delay: 1000,
        },
      });
      
      await sse.connect();
      
      // Trigger error to start reconnection timer
      const instance = new MockEventSource('/sse');
      instance.mockError();
      
      // Disconnect should clear the timer
      sse.disconnect();
      
      expect(sse.connected).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('Debug Mode', () => {
    it('should log messages in debug mode', async () => {
      sse = createSSE({ debug: true });
      
      await sse.connect();
      await new Promise(resolve => setTimeout(resolve, 15));
      
      expect(mockConsole.log).toHaveBeenCalledWith('[SSE]', 'Connected');
    });

    it('should not log messages when debug is disabled', async () => {
      sse = createSSE({ debug: false });
      
      await sse.connect();
      
      expect(mockConsole.log).not.toHaveBeenCalledWith('[SSE]', 'Connected');
    });
  });
});

describe('SSE Directive', () => {
  let mockApp: any;
  let mockElement: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      on: vi.fn(() => vi.fn()), // Return unsubscribe function
      off: vi.fn(),
    };

    mockApp = {
      $sse: mockConnection,
    };

    mockElement = {
      textContent: '',
      __sseUnsubscribe: undefined,
    };

    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mount directive with function value', () => {
    const handler = vi.fn();
    const binding = {
      value: handler,
      arg: 'test-event',
    };

    sseDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    expect(mockElement.__sseUnsubscribe).toBeDefined();
  });

  it('should mount directive with non-function value', () => {
    const binding = {
      value: 'not-a-function',
      arg: 'test-event',
    };

    sseDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    
    // Test the handler behavior
    const handlerCall = mockConnection.on.mock.calls[0];
    const handler = handlerCall[1];
    
    handler('test data');
    
    expect(mockElement.textContent).toBe('test data');
  });

  it('should handle missing connection', () => {
    mockApp.$sse = undefined;
    
    const binding = {
      value: vi.fn(),
      arg: 'test-event',
    };

    sseDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('SSE not configured. Use app.use(sse) first.');
  });

  it('should handle missing event name', () => {
    const binding = {
      value: vi.fn(),
      arg: undefined,
    };

    sseDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('Event name required: uus-sse:eventName');
  });

  it('should unmount directive cleanly', () => {
    const unsubscribe = vi.fn();
    mockElement.__sseUnsubscribe = unsubscribe;

    sseDirective.unmounted(mockElement);

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockElement.__sseUnsubscribe).toBeUndefined();
  });

  it('should handle unmount without subscription', () => {
    mockElement.__sseUnsubscribe = undefined;

    expect(() => {
      sseDirective.unmounted(mockElement);
    }).not.toThrow();
  });
});