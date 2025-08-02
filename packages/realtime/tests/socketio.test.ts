import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSocketIO, ioDirective } from '../src/socketio';

// Mock Socket.io client
const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
};

const mockIO = vi.fn(() => mockSocket);

// Mock dynamic import for socket.io-client
const mockSocketIOModule = {
  io: mockIO,
  default: mockIO,
};

// Mock window.io
Object.defineProperty(window, 'io', {
  value: undefined,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    host: 'localhost:3000',
  },
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('Socket.io Connection', () => {
  let socketio: ReturnType<typeof createSocketIO>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    
    // Reset mock socket state
    mockSocket.connected = false;
    
    // Mock dynamic import
    vi.doMock('socket.io-client', () => mockSocketIOModule);
  });

  afterEach(() => {
    if (socketio) {
      socketio.disconnect();
    }
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.io = undefined;
  });

  describe('Basic Connection', () => {
    it('should create Socket.io connection with default options', () => {
      socketio = createSocketIO();
      
      expect(socketio.connected).toBe(false);
      expect(socketio.connecting).toBe(false);
    });

    it('should create Socket.io connection with custom options', () => {
      socketio = createSocketIO({
        url: 'http://localhost:4000',
        reconnect: {
          enabled: true,
          delay: 2000,
          maxDelay: 60000,
          attempts: 10,
        },
        transports: ['websocket'],
        debug: true,
        socketOptions: {
          timeout: 5000,
        },
      });
      
      expect(socketio.connected).toBe(false);
      expect(socketio.connecting).toBe(false);
    });

    it('should use window.io if available', async () => {
      window.io = mockIO;
      
      socketio = createSocketIO();
      await socketio.connect();
      
      expect(mockIO).toHaveBeenCalled();
    });

    it('should import socket.io-client if not available', async () => {
      window.io = undefined;
      
      // Mock dynamic import by using vi.doMock
      vi.doMock('socket.io-client', () => mockSocketIOModule);
      
      socketio = createSocketIO();
      await socketio.connect();
      
      // Verify that socket was created (which means import succeeded)
      expect(mockIO).toHaveBeenCalled();
    });

    it('should throw error if socket.io-client not found', async () => {
      window.io = undefined;
      
      // Mock failed import
      vi.doMock('socket.io-client', () => {
        throw new Error('Module not found');
      });
      
      socketio = createSocketIO();
      
      await expect(socketio.connect()).rejects.toThrow(
        'Socket.io client not found. Install it with: npm install socket.io-client'
      );
    });

    it('should connect successfully', async () => {
      window.io = mockIO;
      
      socketio = createSocketIO({ url: 'http://localhost:4000' });
      
      await socketio.connect();
      
      expect(mockIO).toHaveBeenCalledWith('http://localhost:4000', expect.objectContaining({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling'],
        auth: {},
      }));
      
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should not connect if already connected', async () => {
      window.io = mockIO;
      socketio = createSocketIO();
      
      // First connection
      await socketio.connect();
      vi.clearAllMocks();
      
      // Mock the internal state to appear connected
      const internalState = (socketio as any).state;
      if (internalState) {
        internalState.connected = true;
      }
      
      // Try to connect again
      await socketio.connect();
      
      expect(mockIO).not.toHaveBeenCalled();
    });

    it('should not connect if already connecting', async () => {
      window.io = mockIO;
      socketio = createSocketIO();
      
      // Start a connection first to set connecting state
      const connectPromise = socketio.connect();
      
      // Try to connect again while first connection is in progress
      await socketio.connect();
      
      // Complete the first connection
      await connectPromise;
      
      // Should only have been called once
      expect(mockIO).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      window.io = mockIO;
    });

    it('should handle function-based auth', async () => {
      const authData = { token: 'test-token', userId: '123' };
      
      socketio = createSocketIO({
        auth: () => authData,
      });
      
      await socketio.connect();
      
      expect(mockIO).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: authData,
        })
      );
    });

    it('should handle async function-based auth', async () => {
      const authData = { token: 'async-token' };
      
      socketio = createSocketIO({
        auth: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return authData;
        },
      });
      
      await socketio.connect();
      
      expect(mockIO).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: authData,
        })
      );
    });

    it('should handle object-based auth', async () => {
      const authData = { token: 'object-token' };
      
      socketio = createSocketIO({
        auth: authData,
      });
      
      await socketio.connect();
      
      expect(mockIO).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: authData,
        })
      );
    });
  });

  describe('Socket Events', () => {
    beforeEach(async () => {
      window.io = mockIO;
      socketio = createSocketIO({ debug: true });
      await socketio.connect();
    });

    it('should handle connect event', () => {
      // Find the connect handler
      const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect');
      expect(connectCall).toBeDefined();
      
      const connectHandler = connectCall[1];
      connectHandler();
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Connected');
    });

    it('should handle disconnect event', () => {
      // Find the disconnect handler
      const disconnectCall = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
      expect(disconnectCall).toBeDefined();
      
      const disconnectHandler = disconnectCall[1];
      disconnectHandler('transport close');
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Disconnected', 'transport close');
    });

    it('should handle connect_error event', () => {
      // Find the connect_error handler
      const errorCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error');
      expect(errorCall).toBeDefined();
      
      const errorHandler = errorCall[1];
      const error = new Error('Connection failed');
      errorHandler(error);
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Connection error', error);
    });

    it('should handle error event', () => {
      // Find the error handler
      const errorCall = mockSocket.on.mock.calls.find(call => call[0] === 'error');
      expect(errorCall).toBeDefined();
      
      const errorHandler = errorCall[1];
      const error = new Error('Socket error');
      errorHandler(error);
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Error', error);
    });
  });

  describe('Messaging', () => {
    beforeEach(async () => {
      window.io = mockIO;
      socketio = createSocketIO({ debug: true });
      await socketio.connect();
    });

    it('should send messages when connected', () => {
      mockSocket.connected = true;
      
      socketio.send('test-event', { message: 'hello' });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { message: 'hello' });
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Message sent', 'test-event', { message: 'hello' });
    });

    it('should handle sending when not connected', () => {
      // Create a fresh socketio instance that hasn't connected
      const freshSocketio = createSocketIO({ debug: true });
      
      freshSocketio.send('test-event', { message: 'hello' });
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      window.io = mockIO;
      socketio = createSocketIO();
      await socketio.connect();
    });

    it('should add event listeners when connected', () => {
      const handler = vi.fn();
      
      const unsubscribe = socketio.on('test-event', handler);
      
      expect(mockSocket.on).toHaveBeenCalledWith('test-event', handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle adding listeners when not connected', () => {
      // Create socketio with debug enabled
      socketio = createSocketIO({ debug: true });
      
      const handler = vi.fn();
      const unsubscribe = socketio.on('test-event', handler);
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Not connected');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should add once listeners when connected', () => {
      const handler = vi.fn();
      
      const unsubscribe = socketio.once('test-event', handler);
      
      expect(mockSocket.once).toHaveBeenCalledWith('test-event', handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle adding once listeners when not connected', () => {
      // Create socketio with debug enabled
      socketio = createSocketIO({ debug: true });
      
      const handler = vi.fn();
      const unsubscribe = socketio.once('test-event', handler);
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Not connected');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove specific event listeners', () => {
      const handler = vi.fn();
      
      socketio.off('test-event', handler);
      
      expect(mockSocket.off).toHaveBeenCalledWith('test-event', handler);
    });

    it('should remove all listeners for an event', () => {
      socketio.off('test-event');
      
      expect(mockSocket.off).toHaveBeenCalledWith('test-event');
    });

    it('should handle removing listeners when not connected', () => {
      // Create a fresh socketio instance that hasn't connected
      const freshSocketio = createSocketIO();
      
      freshSocketio.off('test-event', vi.fn());
      
      // Should not throw or cause errors since socket is null
      expect(mockSocket.off).not.toHaveBeenCalled();
    });
  });

  describe('Room Management', () => {
    beforeEach(async () => {
      window.io = mockIO;
      socketio = createSocketIO();
      await socketio.connect();
    });

    it('should join rooms successfully', async () => {
      const room = 'test-room';
      
      // Mock successful join
      mockSocket.emit.mockImplementation((event, roomName, callback) => {
        if (event === 'join' && callback) {
          setTimeout(() => callback(), 1);
        }
      });
      
      await expect(socketio.join(room)).resolves.toBeUndefined();
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join', room, expect.any(Function));
    });

    it('should handle join errors', async () => {
      const room = 'test-room';
      const error = new Error('Join failed');
      
      // Mock failed join
      mockSocket.emit.mockImplementation((event, roomName, callback) => {
        if (event === 'join' && callback) {
          setTimeout(() => callback(error), 1);
        }
      });
      
      await expect(socketio.join(room)).rejects.toThrow('Join failed');
    });

    it('should throw error when joining without connection', async () => {
      // Create a fresh socketio instance that hasn't connected
      const freshSocketio = createSocketIO();
      
      await expect(freshSocketio.join('test-room')).rejects.toThrow('Not connected');
    });

    it('should leave rooms successfully', async () => {
      const room = 'test-room';
      
      // Mock successful leave
      mockSocket.emit.mockImplementation((event, roomName, callback) => {
        if (event === 'leave' && callback) {
          setTimeout(() => callback(), 1);
        }
      });
      
      await expect(socketio.leave(room)).resolves.toBeUndefined();
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave', room, expect.any(Function));
    });

    it('should handle leave errors', async () => {
      const room = 'test-room';
      const error = new Error('Leave failed');
      
      // Mock failed leave
      mockSocket.emit.mockImplementation((event, roomName, callback) => {
        if (event === 'leave' && callback) {
          setTimeout(() => callback(error), 1);
        }
      });
      
      await expect(socketio.leave(room)).rejects.toThrow('Leave failed');
    });

    it('should throw error when leaving without connection', async () => {
      // Create a fresh socketio instance that hasn't connected
      const freshSocketio = createSocketIO();
      
      await expect(freshSocketio.leave('test-room')).rejects.toThrow('Not connected');
    });
  });

  describe('Disconnection', () => {
    beforeEach(async () => {
      window.io = mockIO;
      socketio = createSocketIO();
      await socketio.connect();
    });

    it('should disconnect cleanly', () => {
      socketio.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketio.connected).toBe(false);
      expect(socketio.connecting).toBe(false);
    });

    it('should handle disconnection when not connected', () => {
      (socketio as any).socket = null;
      
      expect(() => {
        socketio.disconnect();
      }).not.toThrow();
      
      expect(socketio.connected).toBe(false);
      expect(socketio.connecting).toBe(false);
    });
  });

  describe('Connection Errors', () => {
    it('should handle connection failure', async () => {
      window.io = mockIO;
      
      // Mock connection error
      mockIO.mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      socketio = createSocketIO({ debug: true });
      
      await expect(socketio.connect()).rejects.toThrow('Connection failed');
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Failed to connect', expect.any(Error));
    });
  });

  describe('Debug Mode', () => {
    it('should log messages in debug mode', async () => {
      window.io = mockIO;
      socketio = createSocketIO({ debug: true });
      
      socketio.send('test', { data: 'hello' });
      
      expect(mockConsole.log).toHaveBeenCalledWith('[Socket.io]', 'Not connected');
    });

    it('should not log messages when debug is disabled', async () => {
      window.io = mockIO;
      socketio = createSocketIO({ debug: false });
      
      socketio.send('test', { data: 'hello' });
      
      expect(mockConsole.log).not.toHaveBeenCalledWith('[Socket.io]', 'Not connected');
    });
  });
});

describe('Socket.io Directive', () => {
  let mockApp: any;
  let mockElement: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      on: vi.fn(() => vi.fn()), // Return unsubscribe function
      off: vi.fn(),
    };

    mockApp = {
      $io: mockConnection,
    };

    mockElement = {
      textContent: '',
      __ioUnsubscribe: undefined,
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

    ioDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    expect(mockElement.__ioUnsubscribe).toBeDefined();
  });

  it('should mount directive with non-function value', () => {
    const binding = {
      value: 'not-a-function',
      arg: 'test-event',
    };

    ioDirective.mounted(mockElement, binding, mockApp);

    expect(mockConnection.on).toHaveBeenCalledWith('test-event', expect.any(Function));
    
    // Test the handler behavior - should not call value since it's not a function
    const handlerCall = mockConnection.on.mock.calls[0];
    const handler = handlerCall[1];
    
    expect(() => {
      handler('test data');
    }).not.toThrow();
  });

  it('should handle missing connection', () => {
    mockApp.$io = undefined;
    
    const binding = {
      value: vi.fn(),
      arg: 'test-event',
    };

    ioDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('Socket.io not configured. Use app.use(socketio) first.');
  });

  it('should handle missing event name', () => {
    const binding = {
      value: vi.fn(),
      arg: undefined,
    };

    ioDirective.mounted(mockElement, binding, mockApp);

    expect(console.error).toHaveBeenCalledWith('Event name required: uus-io:eventName');
  });

  it('should unmount directive cleanly', () => {
    const unsubscribe = vi.fn();
    mockElement.__ioUnsubscribe = unsubscribe;

    ioDirective.unmounted(mockElement);

    expect(unsubscribe).toHaveBeenCalled();
    expect(mockElement.__ioUnsubscribe).toBeUndefined();
  });

  it('should handle unmount without subscription', () => {
    mockElement.__ioUnsubscribe = undefined;

    expect(() => {
      ioDirective.unmounted(mockElement);
    }).not.toThrow();
  });
});