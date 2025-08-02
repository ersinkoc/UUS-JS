import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRealtime, websocket, sse, socketio } from '../src/index';
import type { Uus } from '@uusjs/core';

// Mock all the connection creators
vi.mock('../src/websocket', () => ({
  createWebSocket: vi.fn(() => mockConnection()),
  wsDirective: { name: 'ws', mounted: vi.fn(), unmounted: vi.fn() },
}));

vi.mock('../src/sse', () => ({
  createSSE: vi.fn(() => mockConnection()),
  sseDirective: { name: 'sse', mounted: vi.fn(), unmounted: vi.fn() },
}));

vi.mock('../src/socketio', () => ({
  createSocketIO: vi.fn(() => mockConnection()),
  ioDirective: { name: 'io', mounted: vi.fn(), unmounted: vi.fn() },
}));

// Mock Uus app
function createMockApp(): Uus {
  const state = { $realtime: undefined };
  return {
    state,
    directive: vi.fn(),
    use: vi.fn(),
  } as any;
}

// Mock connection
function mockConnection() {
  return {
    connected: false,
    connecting: false,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock console.error to avoid test output noise
const mockConsoleError = vi.fn();

describe('Realtime Plugin Index', () => {
  let app: Uus;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createMockApp();
    vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRealtime', () => {
    it('should create websocket realtime plugin', () => {
      const plugin = createRealtime('websocket', { url: 'ws://localhost:3000' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
      expect(typeof plugin.install).toBe('function');
    });

    it('should create sse realtime plugin', () => {
      const plugin = createRealtime('sse', { url: 'http://localhost:3000/sse' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
      expect(typeof plugin.install).toBe('function');
    });

    it('should create socketio realtime plugin', () => {
      const plugin = createRealtime('socketio', { url: 'http://localhost:3000' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
      expect(typeof plugin.install).toBe('function');
    });

    it('should throw error for unknown realtime type', () => {
      expect(() => {
        createRealtime('unknown' as any, {});
      }).toThrow('Unknown realtime type: unknown');
    });

    it('should work with default options', () => {
      const plugin = createRealtime('websocket');
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
    });
  });

  describe('Plugin Installation', () => {
    it('should install websocket plugin correctly', async () => {
      const plugin = createRealtime('websocket', { url: 'ws://localhost:3000' });
      
      await plugin.install(app);
      
      expect(app.$websocket).toBeDefined();
      expect(app.directive).toHaveBeenCalledWith('ws', expect.any(Object));
      expect(app.state.$realtime).toBeDefined();
      expect(app.state.$realtime.connected).toBe(false);
      expect(app.state.$realtime.connecting).toBe(false);
      expect(plugin.connection.connect).toHaveBeenCalled();
    });

    it('should install sse plugin correctly', async () => {
      const plugin = createRealtime('sse', { url: 'http://localhost:3000/sse' });
      
      await plugin.install(app);
      
      expect(app.$sse).toBeDefined();
      expect(app.directive).toHaveBeenCalledWith('sse', expect.any(Object));
      expect(app.state.$realtime).toBeDefined();
      expect(plugin.connection.connect).toHaveBeenCalled();
    });

    it('should install socketio plugin correctly', async () => {
      const plugin = createRealtime('socketio', { url: 'http://localhost:3000' });
      
      await plugin.install(app);
      
      expect(app.$io).toBeDefined();
      expect(app.directive).toHaveBeenCalledWith('io', expect.any(Object));
      expect(app.state.$realtime).toBeDefined();
      expect(plugin.connection.connect).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      const mockConnectionWithError = {
        ...mockConnection(),
        connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
      };

      const { createWebSocket } = await import('../src/websocket');
      vi.mocked(createWebSocket).mockReturnValue(mockConnectionWithError);
      
      const plugin = createRealtime('websocket');
      
      await plugin.install(app);
      
      // Wait for the error to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to connect websocket:', expect.any(Error));
    });

    it('should handle sse connection errors gracefully', async () => {
      const mockConnectionWithError = {
        ...mockConnection(),
        connect: vi.fn().mockRejectedValue(new Error('SSE Connection failed')),
      };

      const { createSSE } = await import('../src/sse');
      vi.mocked(createSSE).mockReturnValue(mockConnectionWithError);
      
      const plugin = createRealtime('sse');
      
      await plugin.install(app);
      
      // Wait for the error to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to connect sse:', expect.any(Error));
    });

    it('should handle socketio connection errors gracefully', async () => {
      const mockConnectionWithError = {
        ...mockConnection(),
        connect: vi.fn().mockRejectedValue(new Error('Socket.io Connection failed')),
      };

      const { createSocketIO } = await import('../src/socketio');
      vi.mocked(createSocketIO).mockReturnValue(mockConnectionWithError);
      
      const plugin = createRealtime('socketio');
      
      await plugin.install(app);
      
      // Wait for the error to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockConsoleError).toHaveBeenCalledWith('Failed to connect socketio:', expect.any(Error));
    });
  });

  describe('Reactive Connection State', () => {
    it('should provide reactive connection state for websocket', async () => {
      const mockConn = mockConnection();
      mockConn.connected = true;
      mockConn.connecting = false;
      
      const { createWebSocket } = await import('../src/websocket');
      vi.mocked(createWebSocket).mockReturnValue(mockConn);
      
      const plugin = createRealtime('websocket');
      await plugin.install(app);
      
      expect(app.state.$realtime.connected).toBe(true);
      expect(app.state.$realtime.connecting).toBe(false);
    });

    it('should provide reactive connection state for sse', async () => {
      const mockConn = mockConnection();
      mockConn.connected = false;
      mockConn.connecting = true;
      
      const { createSSE } = await import('../src/sse');
      vi.mocked(createSSE).mockReturnValue(mockConn);
      
      const plugin = createRealtime('sse');
      await plugin.install(app);
      
      expect(app.state.$realtime.connected).toBe(false);
      expect(app.state.$realtime.connecting).toBe(true);
    });

    it('should provide reactive connection state for socketio', async () => {
      const mockConn = mockConnection();
      mockConn.connected = true;
      mockConn.connecting = false;
      
      const { createSocketIO } = await import('../src/socketio');
      vi.mocked(createSocketIO).mockReturnValue(mockConn);
      
      const plugin = createRealtime('socketio');
      await plugin.install(app);
      
      expect(app.state.$realtime.connected).toBe(true);
      expect(app.state.$realtime.connecting).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    it('should create websocket plugin via factory', () => {
      const plugin = websocket({ url: 'ws://localhost:3000' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
    });

    it('should create sse plugin via factory', () => {
      const plugin = sse({ url: 'http://localhost:3000/sse' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
    });

    it('should create socketio plugin via factory', () => {
      const plugin = socketio({ url: 'http://localhost:3000' });
      
      expect(plugin).toHaveProperty('connection');
      expect(plugin).toHaveProperty('install');
    });

    it('should work with no options', () => {
      const wsPlugin = websocket();
      const ssePlugin = sse();
      const ioPlugin = socketio();
      
      expect(wsPlugin).toHaveProperty('connection');
      expect(ssePlugin).toHaveProperty('connection');
      expect(ioPlugin).toHaveProperty('connection');
    });
  });

  describe('Plugin Interface Compliance', () => {
    it('should expose connection instance in websocket plugin', () => {
      const plugin = websocket();
      
      expect(plugin.connection).toBeDefined();
      expect(plugin.connection).toHaveProperty('connect');
      expect(plugin.connection).toHaveProperty('disconnect');
      expect(plugin.connection).toHaveProperty('send');
      expect(plugin.connection).toHaveProperty('on');
      expect(plugin.connection).toHaveProperty('once');
      expect(plugin.connection).toHaveProperty('off');
      expect(plugin.connection).toHaveProperty('join');
      expect(plugin.connection).toHaveProperty('leave');
    });

    it('should expose connection instance in sse plugin', () => {
      const plugin = sse();
      
      expect(plugin.connection).toBeDefined();
      expect(plugin.connection).toHaveProperty('connect');
      expect(plugin.connection).toHaveProperty('disconnect');
      expect(plugin.connection).toHaveProperty('send');
      expect(plugin.connection).toHaveProperty('on');
      expect(plugin.connection).toHaveProperty('once');
      expect(plugin.connection).toHaveProperty('off');
      expect(plugin.connection).toHaveProperty('join');
      expect(plugin.connection).toHaveProperty('leave');
    });

    it('should expose connection instance in socketio plugin', () => {
      const plugin = socketio();
      
      expect(plugin.connection).toBeDefined();
      expect(plugin.connection).toHaveProperty('connect');
      expect(plugin.connection).toHaveProperty('disconnect');
      expect(plugin.connection).toHaveProperty('send');
      expect(plugin.connection).toHaveProperty('on');
      expect(plugin.connection).toHaveProperty('once');
      expect(plugin.connection).toHaveProperty('off');
      expect(plugin.connection).toHaveProperty('join');
      expect(plugin.connection).toHaveProperty('leave');
    });
  });
});