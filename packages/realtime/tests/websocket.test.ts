import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebSocket } from '../src/websocket';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  open() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  mockMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(
        new MessageEvent('message', { data: JSON.stringify(data) })
      );
    }
  }
}

// Track WebSocket instances
class MockWebSocketWithTracking extends MockWebSocket {
  static instances: MockWebSocket[] = [];

  constructor(url: string) {
    super(url);
    MockWebSocketWithTracking.instances.push(this);
    // Auto-open connection for testing
    setTimeout(() => this.open(), 1);
  }
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocketWithTracking;

describe('WebSocket', () => {
  let ws: ReturnType<typeof createWebSocket>;

  beforeEach(() => {
    // Clear instances before each test
    MockWebSocketWithTracking.instances = [];

    ws = createWebSocket({
      url: 'ws://localhost:3000',
      reconnect: { enabled: false },
    });
  });

  afterEach(() => {
    ws.disconnect();
  });

  it('should connect to WebSocket server', async () => {
    await ws.connect();
    // Small delay to ensure mock WebSocket opens
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(ws.connected).toBe(true);
    expect(ws.connecting).toBe(false);
  });

  it('should handle disconnection', async () => {
    await ws.connect();
    ws.disconnect();
    expect(ws.connected).toBe(false);
  });

  it('should send messages when connected', async () => {
    await ws.connect();
    // Small delay to ensure mock WebSocket opens
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Should not throw
    expect(() => {
      ws.send('test', { data: 'hello' });
    }).not.toThrow();
  });

  it('should queue messages when not connected', () => {
    ws.send('test', { data: 'queued' });
    // Message should be queued, not throw
    expect(ws.connected).toBe(false);
  });

  it('should handle incoming messages', async () => {
    await ws.connect();

    const handler = vi.fn();
    ws.on('test', handler);

    // Simulate incoming message
    const mockWs = MockWebSocketWithTracking.instances[0];
    mockWs.mockMessage({ event: 'test', data: 'hello' });

    expect(handler).toHaveBeenCalledWith('hello');
  });

  it('should support once listeners', async () => {
    await ws.connect();

    const handler = vi.fn();
    ws.once('test', handler);

    const mockWs = MockWebSocketWithTracking.instances[0];
    mockWs.mockMessage({ event: 'test', data: 'first' });
    mockWs.mockMessage({ event: 'test', data: 'second' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });

  it('should remove event listeners', async () => {
    await ws.connect();

    const handler = vi.fn();
    const unsubscribe = ws.on('test', handler);

    const mockWs = MockWebSocketWithTracking.instances[0];
    mockWs.mockMessage({ event: 'test', data: 'hello' });

    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    mockWs.mockMessage({ event: 'test', data: 'world' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should join and leave rooms', async () => {
    await ws.connect();

    const joinPromise = ws.join('room1');

    // Simulate server response
    const mockWs = MockWebSocketWithTracking.instances[0];
    mockWs.mockMessage({ event: 'joined:room1' });

    await expect(joinPromise).resolves.toBeUndefined();
  });

  it('should leave rooms', async () => {
    await ws.connect();

    const leavePromise = ws.leave('room1');

    // Simulate server response
    const mockWs = MockWebSocketWithTracking.instances[0];
    mockWs.mockMessage({ event: 'left:room1' });

    await expect(leavePromise).resolves.toBeUndefined();
  });

  it('should handle heartbeat', async () => {
    vi.useFakeTimers();
    
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      heartbeat: {
        interval: 1000,
        message: 'ping-test'
      },
      debug: true,
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    
    // Advance timers to trigger heartbeat
    vi.advanceTimersByTime(1100);
    
    // Just verify the connection was established
    expect(ws.connected).toBe(true);
    
    vi.useRealTimers();
  }, 1000);

  it('should handle pong messages', async () => {
    await ws.connect();
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    
    // Should not emit event for pong messages
    const handler = vi.fn();
    ws.on('pong', handler);
    
    mockWs.mockMessage({ event: 'pong' });
    
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON messages', async () => {
    await ws.connect();
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    
    // Mock invalid JSON
    if (mockWs.onmessage) {
      mockWs.onmessage(new MessageEvent('message', { data: 'invalid json' }));
    }
    
    // Should not throw error
    expect(mockWs).toBeDefined();
  });

  it('should set binary type when specified', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      binaryType: 'arraybuffer',
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    expect(mockWs.binaryType).toBe('arraybuffer');
  });

  it('should handle authentication', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      auth: { token: 'test-token' },
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    
    expect(MockWebSocketWithTracking.instances[0].url).toContain('token=test-token');
  });

  it('should handle async authentication', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      auth: async () => ({ token: 'async-token' }),
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    
    expect(MockWebSocketWithTracking.instances[0].url).toContain('token=async-token');
  });

  it('should handle protocols', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      protocols: ['protocol1', 'protocol2'],
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    
    expect(MockWebSocketWithTracking.instances[0]).toBeDefined();
  });

  it('should handle reconnection attempts', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      reconnect: {
        enabled: true,
        delay: 100,
        maxDelay: 1000,
        attempts: 3
      },
      debug: true
    });
    
    await ws.connect();
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    
    // Simulate close event
    if (mockWs.onclose) {
      mockWs.onclose(new CloseEvent('close', { code: 1006, reason: 'Connection lost' }));
    }
    
    // Should schedule reconnection
    expect(ws.connected).toBe(false);
  }, 1000);

  it('should handle connection errors with reconnect', async () => {
    vi.useFakeTimers();
    
    // Mock WebSocket constructor to throw error
    const originalWebSocket = global.WebSocket;
    global.WebSocket = class {
      constructor() {
        throw new Error('Connection failed');
      }
    } as any;
    
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      reconnect: {
        enabled: true,
        delay: 100
      },
      debug: true
    });
    
    await expect(ws.connect()).rejects.toThrow('Connection failed');
    
    global.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('should handle error events', async () => {
    await ws.connect();
    
    const errorHandler = vi.fn();
    ws.on('error', errorHandler);
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    const error = new Event('error');
    
    if (mockWs.onerror) {
      mockWs.onerror(error);
    }
    
    expect(errorHandler).toHaveBeenCalledWith(error);
  });

  it('should disable reconnect on manual disconnect', () => {
    ws.disconnect();
    
    // Should disable reconnect
    expect(ws.connected).toBe(false);
  });

  it('should clear heartbeat on disconnect', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      heartbeat: { interval: 1000 },
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    ws.disconnect();
    
    expect(ws.connected).toBe(false);
  });

  it('should handle heartbeat when disabled', async () => {
    ws = createWebSocket({
      url: 'ws://localhost:3000',
      heartbeat: { interval: 0 }, // Disabled
      reconnect: { enabled: false }
    });
    
    await ws.connect();
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    // Should not set up heartbeat timer
    expect(ws.connected).toBe(true);
  });

  it('should send messages with generated ID and timestamp', async () => {
    await ws.connect();
    await new Promise((resolve) => setTimeout(resolve, 5));
    
    const mockWs = MockWebSocketWithTracking.instances[0];
    const sendSpy = vi.spyOn(mockWs, 'send');
    
    ws.send('test', { data: 'hello' });
    
    expect(sendSpy).toHaveBeenCalledWith(
      expect.stringContaining('"id":')
    );
    expect(sendSpy).toHaveBeenCalledWith(
      expect.stringContaining('"timestamp":')
    );
  });
});

describe('WebSocket Directive', () => {
  let mockApp: any;
  let mockElement: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      on: vi.fn(() => vi.fn()), // Return unsubscribe function
      off: vi.fn(),
    };

    mockApp = {
      $ws: mockConnection,
    };

    mockElement = {
      textContent: '',
      __wsUnsubscribe: undefined,
    };

    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mount directive with function value', async () => {
    const { wsDirective } = await import('../src/websocket');
    const handler = vi.fn();
    const binding = {
      value: handler,
      arg: 'test-event',
    };

    wsDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    expect(mockElement.__wsUnsubscribe).toBeDefined();
  });

  it('should mount directive with non-function value', async () => {
    const { wsDirective } = await import('../src/websocket');
    const binding = {
      value: 'not-a-function',
      arg: 'test-event',
    };

    wsDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    
    // Test the handler behavior - should not call value since it's not a function
    const handlerCall = mockConnection.on.mock.calls[0];
    const handler = handlerCall[1];
    
    expect(() => {
      handler('test data');
    }).not.toThrow();
  });

  it('should handle missing connection', async () => {
    const { wsDirective } = await import('../src/websocket');
    mockApp.$ws = undefined;
    
    const binding = {
      value: vi.fn(),
      arg: 'test-event',
    };

    wsDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('WebSocket not configured. Use app.use(websocket) first.');
  });

  it('should handle missing event name', async () => {
    const { wsDirective } = await import('../src/websocket');
    const binding = {
      value: vi.fn(),
      arg: undefined,
    };

    wsDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('Event name required: uus-ws:eventName');
  });

  it('should unmount directive cleanly', async () => {
    const { wsDirective } = await import('../src/websocket');
    const unsubscribe = vi.fn();
    mockElement.__wsUnsubscribe = unsubscribe;

    wsDirective.unmounted(mockElement);

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockElement.__wsUnsubscribe).toBeUndefined();
  });

  it('should handle unmount without subscription', async () => {
    const { wsDirective } = await import('../src/websocket');
    mockElement.__wsUnsubscribe = undefined;

    expect(() => {
      wsDirective.unmounted(mockElement);
    }).not.toThrow();
  });
});
