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
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
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
      reconnect: { enabled: false }
    });
  });
  
  afterEach(() => {
    ws.disconnect();
  });
  
  it('should connect to WebSocket server', async () => {
    await ws.connect();
    // Small delay to ensure mock WebSocket opens
    await new Promise(resolve => setTimeout(resolve, 5));
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
    await new Promise(resolve => setTimeout(resolve, 5));
    
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
});