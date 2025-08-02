import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DevTools, DevToolsExtensionBridge, initDevTools, type DevToolsConfig } from '../src/devtools';
import { Uus } from '../src/uus';
import { reactive, ref, isRef, isReactive, toRaw } from '../src/reactive';

// Mock browser APIs
const mockConsole = {
  log: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  table: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
};

const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  getEntries: vi.fn(() => []),
}));

const mockURL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

const mockBlob = vi.fn().mockImplementation((content, options) => ({
  text: vi.fn(() => Promise.resolve(JSON.stringify(content))),
  size: 1024,
  type: options?.type || 'text/plain',
}));

const mockElement = (tagName: string = 'div', attributes: Record<string, string> = {}) => {
  const attrs = Object.entries(attributes).map(([name, value]) => ({ name, value }));
  return {
    tagName: tagName.toUpperCase(),
    attributes: attrs,
    children: [],
    getAttribute: vi.fn((name) => attributes[name] || null),
    setAttribute: vi.fn(),
    click: vi.fn(),
  };
};

const mockDocument = {
  createElement: vi.fn((tagName) => mockElement(tagName)),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  postMessage: vi.fn(),
  __UUS_DEVTOOLS__: undefined,
  __UUS_APP__: undefined,
};

// Global mocks
global.console = mockConsole as any;
global.performance = mockPerformance as any;
global.PerformanceObserver = mockPerformanceObserver as any;
global.URL = mockURL as any;
global.Blob = mockBlob as any;
global.document = mockDocument as any;
global.window = mockWindow as any;

// Mock process.env
Object.defineProperty(global, 'process', {
  value: {
    env: {
      NODE_ENV: 'development',
    },
  },
  writable: true,
});

describe('DevTools', () => {
  let app: Uus;
  let devtools: DevTools;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Uus();
    app.state = reactive({
      count: 0,
      user: { name: 'John', age: 30 },
      items: ['a', 'b', 'c'],
    });
    app.rootElement = mockElement('div') as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should create DevTools instance with default config', () => {
      devtools = new DevTools(app);

      expect(devtools).toBeInstanceOf(DevTools);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '%c🔧 Uus.js DevTools Enabled',
        'background: #3498db; color: white; padding: 4px 8px; border-radius: 4px;'
      );
    });

    it('should create DevTools instance with custom config', () => {
      const config: DevToolsConfig = {
        logStateChanges: false,
        logDirectives: true,
        logLifecycle: true,
        performanceMetrics: true,
        breakOnError: true,
      };

      devtools = new DevTools(app, config);

      expect(devtools).toBeInstanceOf(DevTools);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '%c🔧 Uus.js DevTools Enabled',
        'background: #3498db; color: white; padding: 4px 8px; border-radius: 4px;'
      );
    });

    it('should expose devtools and app to window', () => {
      devtools = new DevTools(app);

      expect(mockWindow.__UUS_DEVTOOLS__).toBe(devtools);
      expect(mockWindow.__UUS_APP__).toBe(app);
    });

    it('should setup performance tracking when enabled', () => {
      devtools = new DevTools(app, { performanceMetrics: true });

      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should setup error handling when enabled', () => {
      devtools = new DevTools(app, { breakOnError: true });

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('State Tracking', () => {
    beforeEach(() => {
      devtools = new DevTools(app, { logStateChanges: true });
    });

    it('should record state snapshots', () => {
      const history = devtools.getHistory();
      const initialLength = history.length;

      // Trigger state change by directly calling private method
      const recordStateSnapshot = (devtools as any).recordStateSnapshot;
      recordStateSnapshot.call(devtools);

      expect(devtools.getHistory().length).toBe(initialLength + 1);
    });

    it('should limit state history to 50 snapshots', () => {
      // Add 55 snapshots
      for (let i = 0; i < 55; i++) {
        const recordStateSnapshot = (devtools as any).recordStateSnapshot;
        recordStateSnapshot.call(devtools);
      }

      expect(devtools.getHistory().length).toBe(50);
    });

    it('should format ref values correctly', () => {
      const formatValue = (devtools as any).formatValue;
      const refValue = ref('test');
      const reactiveValue = reactive({ test: 'value' });
      const plainValue = 'plain';

      expect(formatValue.call(devtools, refValue)).toEqual({ ref: 'test' });
      expect(formatValue.call(devtools, reactiveValue)).toBe(toRaw(reactiveValue));
      expect(formatValue.call(devtools, plainValue)).toBe('plain');
    });

    it('should get state snapshot correctly', () => {
      const getStateSnapshot = (devtools as any).getStateSnapshot;
      const snapshot = getStateSnapshot.call(devtools);

      expect(snapshot).toHaveProperty('count', 0);
      expect(snapshot).toHaveProperty('user');
      expect(snapshot).toHaveProperty('items');
    });
  });

  describe('Public API Methods', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should log current state', () => {
      devtools.logState();

      expect(mockConsole.group).toHaveBeenCalledWith(
        '%c📊 Current State',
        'color: #3498db; font-weight: bold;'
      );
      expect(mockConsole.table).toHaveBeenCalled();
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should return state history', () => {
      // Add some history
      const recordStateSnapshot = (devtools as any).recordStateSnapshot;
      recordStateSnapshot.call(devtools);

      const history = devtools.getHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('state');
    });

    it('should clear state history', () => {
      // Add some history first
      const recordStateSnapshot = (devtools as any).recordStateSnapshot;
      recordStateSnapshot.call(devtools);

      expect(devtools.getHistory().length).toBeGreaterThan(0);

      devtools.clearHistory();

      expect(devtools.getHistory().length).toBe(0);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '%c🗑️ State history cleared',
        'color: #95a5a6;'
      );
    });

    it('should handle time travel with valid index', () => {
      // Add history
      const recordStateSnapshot = (devtools as any).recordStateSnapshot;
      recordStateSnapshot.call(devtools);
      
      // Modify state manually without triggering proxy
      const history = devtools.getHistory();
      expect(history.length).toBe(1);

      // Time travel to first snapshot
      devtools.timeTravel(0);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('%c⏰ Time traveling to'),
        'color: #9b59b6; font-weight: bold;'
      );
    });

    it('should handle time travel with invalid index', () => {
      devtools.timeTravel(999);

      expect(mockConsole.error).toHaveBeenCalledWith('Invalid history index');
    });
  });

  describe('Element Inspection', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should inspect element with directives', () => {
      const element = mockElement('div', {
        'uus-text': 'message',
        ':class': 'isActive',
        '@click': 'handleClick',
        'data-id': '123',
      });

      devtools.inspectElement(element as any);

      expect(mockConsole.group).toHaveBeenCalledWith(
        '%c🔍 Element Inspector',
        'color: #3498db; font-weight: bold;'
      );
      expect(mockConsole.log).toHaveBeenCalledWith('%cElement:', 'font-weight: bold;', element);
      expect(mockConsole.log).toHaveBeenCalledWith('%cDirectives:', 'font-weight: bold;');
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should extract element directives correctly', () => {
      const element = mockElement('div', {
        'uus-text': 'message',
        ':class': 'isActive',
        '@click': 'handleClick',
        'data-id': '123', // Should not be included
        'regular-attr': 'value', // Should not be included
      });

      const getElementDirectives = (devtools as any).getElementDirectives;
      const directives = getElementDirectives.call(devtools, element);

      expect(directives).toHaveLength(3);
      expect(directives).toEqual(
        expect.arrayContaining([
          { name: 'uus-text', value: 'message' },
          { name: ':class', value: 'isActive' },
          { name: '@click', value: 'handleClick' },
        ])
      );
    });

    it('should find elements by state property', () => {
      const elements = [
        mockElement('div', { 'uus-state': 'count' }),
        mockElement('span', { 'uus-state': 'user.name' }),
        mockElement('p', { 'uus-text': 'message' }),
      ];

      mockDocument.querySelectorAll.mockReturnValue(elements);

      const foundElements = devtools.findByState('count');

      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('[uus-state]');
      expect(foundElements).toContain(elements[0]);
      expect(foundElements).not.toContain(elements[2]);
    });
  });

  describe('Component Tree Visualization', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should visualize component tree', () => {
      const rootElement = mockElement('div', { 'uus-state': 'app' });
      const childElement = mockElement('span', { 'uus-text': 'message' });
      rootElement.children = [childElement];
      app.rootElement = rootElement as any;

      devtools.visualizeTree();

      expect(mockConsole.group).toHaveBeenCalledWith(
        '%c🌳 Component Tree',
        'color: #27ae60; font-weight: bold;'
      );
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should handle missing root element', () => {
      app.rootElement = null;

      devtools.visualizeTree();

      expect(mockConsole.error).toHaveBeenCalledWith('App not mounted');
    });

    it('should print tree structure correctly', () => {
      const rootElement = mockElement('div', { 'uus-state': 'app' });
      const childElement = mockElement('span', { 'uus-text': 'message' });
      rootElement.children = [childElement];

      const printTree = (devtools as any).printTree;
      printTree.call(devtools, rootElement, 0);

      expect(mockConsole.log).toHaveBeenCalledWith('div [uus-state]');
    });
  });

  describe('Performance Profiling', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should start profiling', () => {
      mockPerformance.now.mockReturnValue(1000);

      devtools.startProfiling('test-operation');

      expect(mockPerformance.now).toHaveBeenCalled();
    });

    it('should end profiling and return duration', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);

      devtools.startProfiling('test-operation');
      const duration = devtools.endProfiling('test-operation');

      expect(duration).toBe(50);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '%c⏱️ test-operation: 50.00ms',
        'color: #27ae60;'
      );
    });

    it('should handle ending profiling without start', () => {
      devtools.endProfiling('non-existent');

      expect(mockConsole.error).toHaveBeenCalledWith(
        'No profiling started for "non-existent"'
      );
    });
  });

  describe('State Import/Export', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should export state', () => {
      const createElement = mockDocument.createElement;
      const mockAnchor = mockElement('a');
      createElement.mockReturnValue(mockAnchor);

      devtools.exportState();

      expect(mockBlob).toHaveBeenCalledWith(
        [expect.stringContaining('"state"')],
        { type: 'application/json' }
      );
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith('%c💾 State exported', 'color: #3498db;');
    });

    it('should import state successfully', async () => {
      const stateData = {
        state: { count: 10 },
        history: [{ timestamp: Date.now(), state: { count: 5 } }],
      };

      const mockFile = {
        text: vi.fn(() => Promise.resolve(JSON.stringify(stateData))),
      };

      await devtools.importState(mockFile as any);

      expect(app.state.count).toBe(10);
      expect(mockFile.text).toHaveBeenCalled();
    });

    it('should handle import state errors', async () => {
      const mockFile = {
        text: vi.fn(() => Promise.resolve('invalid json')),
      };

      await devtools.importState(mockFile as any);

      expect(mockConsole.error).toHaveBeenCalledWith('Failed to import state:', expect.any(Error));
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      devtools = new DevTools(app, { breakOnError: true });
    });

    it('should handle window error events', () => {
      const errorHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      const mockError = new Error('Test error');
      const mockEvent = { error: mockError };

      errorHandler?.(mockEvent);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '%c❌ Uus.js Error',
        'background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px;',
        mockError
      );
    });
  });

  describe('DevToolsExtensionBridge', () => {
    let bridge: DevToolsExtensionBridge;

    beforeEach(() => {
      bridge = new DevToolsExtensionBridge(app);
    });

    it('should create extension bridge', () => {
      expect(bridge).toBeInstanceOf(DevToolsExtensionBridge);
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should send init message on creation', () => {
      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'uus-devtools',
          type: 'init',
          data: expect.objectContaining({
            version: '0.0.1',
            state: expect.any(Object),
          }),
        }),
        '*'
      );
    });

    it('should handle get-state message', () => {
      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const mockEvent = {
        data: {
          source: 'uus-devtools-extension',
          type: 'get-state',
        },
      };

      messageHandler?.(mockEvent);

      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'uus-devtools',
          type: 'state-update',
          data: expect.any(Object),
        }),
        '*'
      );
    });

    it('should handle update-state message', () => {
      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const updates = { count: 25, newField: 'updated' };
      const mockEvent = {
        data: {
          source: 'uus-devtools-extension',
          type: 'update-state',
          data: updates,
        },
      };

      messageHandler?.(mockEvent);

      expect(app.state.count).toBe(25);
      expect(app.state.newField).toBe('updated');
    });

    it('should handle time-travel message', () => {
      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const snapshot = { count: 15, user: { name: 'Jane', age: 25 } };
      const mockEvent = {
        data: {
          source: 'uus-devtools-extension',
          type: 'time-travel',
          data: snapshot,
        },
      };

      messageHandler?.(mockEvent);

      expect(app.state.count).toBe(15);
      expect(app.state.user.name).toBe('Jane');
    });

    it('should handle inspect-element message', () => {
      const element = mockElement('div', { 'uus-text': 'test' });
      mockDocument.querySelector.mockReturnValue(element);

      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const mockEvent = {
        data: {
          source: 'uus-devtools-extension',
          type: 'inspect-element',
          data: '.test-selector',
        },
      };

      messageHandler?.(mockEvent);

      expect(mockDocument.querySelector).toHaveBeenCalledWith('.test-selector');
      expect(mockWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'uus-devtools',
          type: 'element-info',
          data: expect.objectContaining({
            selector: '.test-selector',
            directives: expect.any(Array),
            state: expect.any(Object),
          }),
        }),
        '*'
      );
    });

    it('should ignore messages from other sources', () => {
      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const postMessageCallCount = mockWindow.postMessage.mock.calls.length;

      const mockEvent = {
        data: {
          source: 'other-extension',
          type: 'get-state',
        },
      };

      messageHandler?.(mockEvent);

      // Should not have called postMessage again
      expect(mockWindow.postMessage.mock.calls.length).toBe(postMessageCallCount);
    });

    it('should handle inspect-element with missing element', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const messageHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const postMessageCallCount = mockWindow.postMessage.mock.calls.length;

      const mockEvent = {
        data: {
          source: 'uus-devtools-extension',
          type: 'inspect-element',
          data: '.non-existent',
        },
      };

      messageHandler?.(mockEvent);

      // Should not send element-info message
      expect(mockWindow.postMessage.mock.calls.length).toBe(postMessageCallCount);
    });

    it('should serialize reactive state correctly', () => {
      const getSerializableState = (bridge as any).getSerializableState;
      const serialized = getSerializableState.call(bridge);

      expect(serialized).toHaveProperty('count', 0);
      expect(serialized).toHaveProperty('user');
      expect(serialized).toHaveProperty('items');
    });
  });

  describe('initDevTools Function', () => {
    beforeEach(() => {
      // Reset process.env
      global.process = {
        env: {
          NODE_ENV: 'development',
        },
      } as any;
    });

    it('should initialize devtools in development environment', () => {
      const result = initDevTools(app);

      expect(result).toBeInstanceOf(DevTools);
    });

    it('should return null in production environment', () => {
      global.process = {
        env: {
          NODE_ENV: 'production',
        },
      } as any;

      const result = initDevTools(app);

      expect(result).toBeNull();
    });

    it('should pass config to DevTools constructor', () => {
      const config: DevToolsConfig = {
        logStateChanges: false,
        performanceMetrics: true,
      };

      const result = initDevTools(app, config);

      expect(result).toBeInstanceOf(DevTools);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    beforeEach(() => {
      devtools = new DevTools(app);
    });

    it('should handle performance tracking with uus-prefixed entries', () => {
      // Create new devtools with performance metrics enabled
      const devtoolsWithPerf = new DevTools(app, { performanceMetrics: true });
      
      const mockEntries = [
        { name: 'uus-render', duration: 15.5 },
        { name: 'other-metric', duration: 10.0 },
        { name: 'uus-compile', duration: 8.2 },
      ];

      // Get the observer callback from the most recent call
      const observerCallback = mockPerformanceObserver.mock.calls[mockPerformanceObserver.mock.calls.length - 1]?.[0];
      if (observerCallback) {
        // Clear previous console calls
        mockConsole.log.mockClear();
        
        observerCallback({
          getEntries: () => mockEntries,
        });

        expect(mockConsole.log).toHaveBeenCalledWith(
          '%c⚡ uus-render: 15.50ms',
          'color: #27ae60;'
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
          '%c⚡ uus-compile: 8.20ms',
          'color: #27ae60;'
        );
      }
    });

    it('should handle state tracking when state is not reactive', () => {
      app.state = {} as any; // Non-reactive object
      const devtoolsWithNonReactive = new DevTools(app, { logStateChanges: true });

      // Should not throw error
      expect(devtoolsWithNonReactive).toBeInstanceOf(DevTools);
    });

    it('should handle findByState with elements that have parsing errors', () => {
      const elementsWithErrors = [
        {
          ...mockElement('div', { 'uus-state': 'valid.property' }),
          getAttribute: vi.fn(() => { throw new Error('Parse error'); }),
        },
        mockElement('span', { 'uus-state': 'valid.property' }),
      ];

      mockDocument.querySelectorAll.mockReturnValue(elementsWithErrors);

      const foundElements = devtools.findByState('property');

      // Should handle errors gracefully and still return valid elements
      expect(foundElements).toHaveLength(1);
    });

    it('should handle window undefined scenario', () => {
      const originalWindow = global.window;
      global.window = undefined as any;

      // Should not throw when window is undefined
      expect(() => new DevTools(app)).not.toThrow();

      global.window = originalWindow;
    });

    it('should handle multiple performance marks with same name', () => {
      devtools.startProfiling('test');
      devtools.startProfiling('test'); // Override previous

      mockPerformance.now.mockReturnValue(2000);
      const duration = devtools.endProfiling('test');

      expect(duration).toBeDefined();
    });
  });
});