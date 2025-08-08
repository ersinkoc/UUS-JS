/**
 * Uus.js DevTools Integration
 * Provides debugging utilities and development tools
 */

import { Uus } from './uus';
import { isRef, isReactive, toRaw } from './reactive';
import { memoryManager } from './memory';

// DevTools-specific types
interface StateSnapshot {
  timestamp: number;
  state: Record<string, unknown>;
}

interface DirectiveInfo {
  name: string;
  value: string;
}

interface ElementInfo {
  selector: string;
  directives: DirectiveInfo[];
  state: Record<string, unknown>;
}

interface DevToolsMessage {
  source?: string;
  type: string;
  data?: Record<string, unknown> | StateSnapshot | ElementInfo | string;
}

interface WindowWithDevTools extends Window {
  __UUS_DEVTOOLS__?: DevTools;
  __UUS_APP__?: Uus;
}

export interface DevToolsConfig {
  logStateChanges?: boolean;
  logDirectives?: boolean;
  logLifecycle?: boolean;
  performanceMetrics?: boolean;
  breakOnError?: boolean;
}

export class DevTools {
  private app: Uus;
  private config: DevToolsConfig;
  private stateHistory: StateSnapshot[] = [];
  private performanceMarks: Map<string, number> = new Map();
  private cleanupFunctions: Set<() => void> = new Set();
  private observers: Set<PerformanceObserver> = new Set();
  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];

  constructor(app: Uus, config: DevToolsConfig = {}) {
    this.app = app;
    this.config = {
      logStateChanges: true,
      logDirectives: false,
      logLifecycle: false,
      performanceMetrics: false,
      breakOnError: false,
      ...config,
    };

    this.init();
  }

  private init() {
    // Expose to window for console access
    if (typeof window !== 'undefined') {
      (window as WindowWithDevTools).__UUS_DEVTOOLS__ = this;
      (window as WindowWithDevTools).__UUS_APP__ = this.app;

      console.log(
        '%c🔧 Uus.js DevTools Enabled',
        'background: #3498db; color: white; padding: 4px 8px; border-radius: 4px;'
      );
      console.log('Access app state with: __UUS_APP__.state');
      console.log('Access devtools with: __UUS_DEVTOOLS__');
    }

    this.setupStateTracking();
    this.setupErrorHandling();
    this.setupPerformanceTracking();
  }

  private setupStateTracking() {
    if (!this.config.logStateChanges) return;

    // Track state changes by accessing the proxy handler set method
    const stateProxy = this.app.state;
    if (stateProxy && typeof stateProxy === 'object') {
      // Access the raw object to get the original set method
      const rawState = (stateProxy as Record<string, unknown>).__raw;
      if (rawState) {
        // Store reference to watch for changes
        const originalState = rawState as Record<string, unknown>;

        // We'll use a Proxy to intercept set operations
        Object.keys(originalState).forEach((key) => {
          let currentValue = originalState[key];
          Object.defineProperty(stateProxy, key, {
            get() {
              return currentValue;
            },
            set(newValue: unknown) {
              const oldValue = currentValue;
              currentValue = newValue;
              if (oldValue !== newValue) {
                this.logStateChange(key, oldValue, newValue);
                this.recordStateSnapshot();
              }
            },
            enumerable: true,
            configurable: true,
          });
        });
      }
    }
  }

  private setupErrorHandling() {
    if (!this.config.breakOnError) return;

    const errorHandler = (event: ErrorEvent) => {
      console.error(
        '%c❌ Uus.js Error',
        'background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px;',
        event.error
      );

      // Break on error is enabled but debugger statement removed for production
      // Use browser dev tools or conditional breakpoints instead
    };

    window.addEventListener('error', errorHandler as EventListener);
    this.eventListeners.push({
      target: window,
      type: 'error',
      listener: errorHandler as EventListener,
    });
  }

  private setupPerformanceTracking() {
    if (!this.config.performanceMetrics) return;

    // Track render performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.startsWith('uus-')) {
          console.log(
            `%c⚡ ${entry.name}: ${entry.duration.toFixed(2)}ms`,
            'color: #27ae60;'
          );
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['measure'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }
  }

  private logStateChange(key: string, oldValue: unknown, newValue: unknown) {
    const timestamp = new Date().toLocaleTimeString();

    console.group(
      `%c🔄 State Change [${timestamp}]`,
      'color: #3498db; font-weight: bold;'
    );
    console.log(
      `%cProperty:%c ${key}`,
      'font-weight: bold;',
      'font-weight: normal;'
    );
    console.log('%cOld:', 'color: #e74c3c;', this.formatValue(oldValue));
    console.log('%cNew:', 'color: #27ae60;', this.formatValue(newValue));
    console.trace('Stack trace');
    console.groupEnd();
  }

  private formatValue(value: unknown): unknown {
    if (isRef(value)) {
      return { ref: value.value };
    }
    if (isReactive(value)) {
      return toRaw(value);
    }
    return value;
  }

  private recordStateSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      state: this.getStateSnapshot(),
    };

    this.stateHistory.push(snapshot);

    // Keep only last 50 snapshots to prevent memory leaks
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }

    // Periodically clean up old snapshots
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    this.stateHistory = this.stateHistory.filter(
      (snap) => now - snap.timestamp < maxAge
    );
  }

  private getStateSnapshot(): Record<string, unknown> {
    const snapshot: Record<string, unknown> = {};

    for (const key in this.app.state) {
      snapshot[key] = this.formatValue(this.app.state[key]);
    }

    return snapshot;
  }

  // Public API

  /**
   * Log current state
   */
  logState() {
    console.group('%c📊 Current State', 'color: #3498db; font-weight: bold;');
    console.table(this.getStateSnapshot());
    console.groupEnd();
  }

  /**
   * Get state history
   */
  getHistory() {
    return this.stateHistory;
  }

  /**
   * Time travel to a previous state
   */
  timeTravel(index: number) {
    const snapshot = this.stateHistory[index];
    if (!snapshot) {
      console.error('Invalid history index');
      return;
    }

    console.log(
      `%c⏰ Time traveling to ${new Date(snapshot.timestamp).toLocaleTimeString()}`,
      'color: #9b59b6; font-weight: bold;'
    );

    // Restore state
    Object.assign(this.app.state, snapshot.state);
  }

  /**
   * Clear state history
   */
  clearHistory() {
    this.stateHistory = [];
    console.log('%c🗑️ State history cleared', 'color: #95a5a6;');
  }

  /**
   * Inspect element directives
   */
  inspectElement(element: Element) {
    const directives = this.getElementDirectives(element);

    console.group(
      '%c🔍 Element Inspector',
      'color: #3498db; font-weight: bold;'
    );
    console.log('%cElement:', 'font-weight: bold;', element);
    console.log('%cDirectives:', 'font-weight: bold;');

    directives.forEach((directive) => {
      console.log(`  ${directive.name}: ${directive.value}`);
    });

    console.groupEnd();
  }

  private getElementDirectives(element: Element): DirectiveInfo[] {
    const directives: DirectiveInfo[] = [];

    for (const attr of element.attributes) {
      if (
        attr.name.startsWith('uus-') ||
        attr.name.startsWith(':') ||
        attr.name.startsWith('@')
      ) {
        directives.push({
          name: attr.name,
          value: attr.value,
        });
      }
    }

    return directives;
  }

  /**
   * Performance profiling
   */
  startProfiling(name: string) {
    this.performanceMarks.set(name, performance.now());
  }

  endProfiling(name: string) {
    const startTime = this.performanceMarks.get(name);
    if (!startTime) {
      console.error(`No profiling started for "${name}"`);
      return;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(name);

    console.log(`%c⏱️ ${name}: ${duration.toFixed(2)}ms`, 'color: #27ae60;');

    return duration;
  }

  /**
   * Find components by state property
   */
  findByState(property: string, _value?: unknown) {
    const elements: Element[] = [];
    const allElements = document.querySelectorAll('[uus-state]');

    allElements.forEach((el) => {
      try {
        const stateAttr = el.getAttribute('uus-state');
        if (stateAttr) {
          // Check if element's state contains the property
          // This is simplified - in real implementation would parse and evaluate
          if (stateAttr.includes(property)) {
            elements.push(el);
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    console.group(`%c🔍 Elements with state.${property}`, 'color: #3498db;');
    elements.forEach((el) => console.log(el));
    console.groupEnd();

    return elements;
  }

  /**
   * Visualize component tree
   */
  visualizeTree() {
    const root = this.app.rootElement;
    if (!root) {
      console.error('App not mounted');
      return;
    }

    console.group('%c🌳 Component Tree', 'color: #27ae60; font-weight: bold;');
    this.printTree(root, 0);
    console.groupEnd();
  }

  private printTree(element: Element, depth: number) {
    const indent = '  '.repeat(depth);
    const directives = this.getElementDirectives(element);
    const directiveStr = directives.map((d) => d.name).join(' ');

    console.log(
      `${indent}${element.tagName.toLowerCase()}${directiveStr ? ` [${directiveStr}]` : ''}`
    );

    for (const child of element.children) {
      this.printTree(child, depth + 1);
    }
  }

  /**
   * Export state for debugging
   */
  exportState() {
    const data = {
      state: this.getStateSnapshot(),
      history: this.stateHistory,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uus-state-${Date.now()}.json`;
    a.click();

    console.log('%c💾 State exported', 'color: #3498db;');
  }

  /**
   * Import state for debugging
   */
  async importState(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.state) {
        Object.assign(this.app.state, data.state);
        console.log('%c📥 State imported', 'color: #27ae60;');
      }

      if (data.history) {
        this.stateHistory = data.history;
        console.log(
          `%c📚 Imported ${data.history.length} history snapshots`,
          'color: #27ae60;'
        );
      }
    } catch (error) {
      console.error('Failed to import state:', error);
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      devtools: {
        stateHistory: this.stateHistory.length,
        performanceMarks: this.performanceMarks.size,
        observers: this.observers.size,
        eventListeners: this.eventListeners.length,
      },
      app: (this.app as any).getMemoryStats?.() || 'Not available',
      global: memoryManager.getMemoryStats(),
    };
  }

  /**
   * Cleanup DevTools resources
   */
  destroy() {
    // Clear state history
    this.stateHistory = [];

    // Clear performance marks
    this.performanceMarks.clear();

    // Disconnect observers
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    this.observers.clear();

    // Remove event listeners
    this.eventListeners.forEach(({ target, type, listener }) => {
      try {
        target.removeEventListener(type, listener);
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
    this.eventListeners = [];

    // Run cleanup functions
    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error in DevTools cleanup:', error);
      }
    });
    this.cleanupFunctions.clear();

    // Remove from window
    if (typeof window !== 'undefined') {
      delete (window as any).__UUS_DEVTOOLS__;
    }

    console.log('%c🗑️ DevTools cleaned up', 'color: #95a5a6;');
  }
}

/**
 * Chrome Extension Bridge
 * Communicates with Uus.js DevTools Extension
 */
export class DevToolsExtensionBridge {
  private app: Uus;
  private messageListener?: (event: MessageEvent) => void;
  private cleanupFunctions: Set<() => void> = new Set();

  constructor(app: Uus) {
    this.app = app;
    this.init();
  }

  private init() {
    // Listen for messages from extension
    this.messageListener = (event: MessageEvent) => {
      if (event.data.source !== 'uus-devtools-extension') return;
      this.handleMessage(event.data);
    };

    window.addEventListener('message', this.messageListener);

    // Notify extension that app is ready
    this.sendMessage({
      type: 'init',
      data: {
        version: '0.0.1',
        state: this.getSerializableState(),
      },
    });
  }

  /**
   * Cleanup extension bridge resources
   */
  destroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = undefined;
    }

    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error in extension bridge cleanup:', error);
      }
    });
    this.cleanupFunctions.clear();

    console.log('%c🌉 Extension bridge cleaned up', 'color: #95a5a6;');
  }

  private handleMessage(message: DevToolsMessage) {
    switch (message.type) {
      case 'get-state':
        this.sendState();
        break;
      case 'update-state':
        this.updateState(message.data as Record<string, unknown>);
        break;
      case 'time-travel':
        this.timeTravel(message.data as Record<string, unknown>);
        break;
      case 'inspect-element':
        this.inspectElement(message.data as string);
        break;
    }
  }

  private sendMessage(message: DevToolsMessage) {
    window.postMessage(
      {
        source: 'uus-devtools',
        ...message,
      },
      '*'
    );
  }

  private sendState() {
    this.sendMessage({
      type: 'state-update',
      data: this.getSerializableState(),
    });
  }

  private getSerializableState(): Record<string, unknown> {
    // Convert state to plain object for serialization
    const state: Record<string, unknown> = {};

    for (const key in this.app.state) {
      const value = this.app.state[key];
      state[key] = isReactive(value) ? toRaw(value) : value;
    }

    return state;
  }

  private updateState(updates: Record<string, unknown>) {
    Object.assign(this.app.state, updates);
  }

  private timeTravel(snapshot: Record<string, unknown>) {
    Object.assign(this.app.state, snapshot);
  }

  private inspectElement(selector: string) {
    const element = document.querySelector(selector);
    if (!element) return;

    const info = {
      selector,
      directives: this.getElementDirectives(element),
      state: this.getElementState(element),
    };

    this.sendMessage({
      type: 'element-info',
      data: info,
    });
  }

  private getElementDirectives(element: Element): DirectiveInfo[] {
    const directives: DirectiveInfo[] = [];

    for (const attr of element.attributes) {
      if (
        attr.name.startsWith('uus-') ||
        attr.name.startsWith(':') ||
        attr.name.startsWith('@')
      ) {
        directives.push({
          name: attr.name,
          value: attr.value,
        });
      }
    }

    return directives;
  }

  private getElementState(_element: Element): Record<string, unknown> {
    // Get state associated with element
    // This would need to track which state is bound to which element
    return {};
  }
}

// Auto-initialize devtools in development
export function initDevTools(app: Uus, config?: DevToolsConfig) {
  if (process.env.NODE_ENV === 'development') {
    return new DevTools(app, config);
  }
  return null;
}
