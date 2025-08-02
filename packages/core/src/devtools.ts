/**
 * Uus.js DevTools Integration
 * Provides debugging utilities and development tools
 */

import { Uus } from './uus';
import { isRef, isReactive, toRaw } from './reactive';

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
  private stateHistory: any[] = [];
  private performanceMarks: Map<string, number> = new Map();
  
  constructor(app: Uus, config: DevToolsConfig = {}) {
    this.app = app;
    this.config = {
      logStateChanges: true,
      logDirectives: false,
      logLifecycle: false,
      performanceMetrics: false,
      breakOnError: false,
      ...config
    };
    
    this.init();
  }
  
  private init() {
    // Expose to window for console access
    if (typeof window !== 'undefined') {
      (window as any).__UUS_DEVTOOLS__ = this;
      (window as any).__UUS_APP__ = this.app;
      
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
    
    // Track state changes
    const originalSet = this.app.state.set;
    this.app.state.set = (target: any, key: string, value: any, receiver: any) => {
      const oldValue = target[key];
      const result = originalSet.call(this.app.state, target, key, value, receiver);
      
      if (oldValue !== value) {
        this.logStateChange(key, oldValue, value);
        this.recordStateSnapshot();
      }
      
      return result;
    };
  }
  
  private setupErrorHandling() {
    if (!this.config.breakOnError) return;
    
    window.addEventListener('error', (event) => {
      console.error(
        '%c❌ Uus.js Error',
        'background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px;',
        event.error
      );
      
      // Pause execution in debugger
      debugger;
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
    
    observer.observe({ entryTypes: ['measure'] });
  }
  
  private logStateChange(key: string, oldValue: any, newValue: any) {
    const timestamp = new Date().toLocaleTimeString();
    
    console.group(
      `%c🔄 State Change [${timestamp}]`,
      'color: #3498db; font-weight: bold;'
    );
    console.log(`%cProperty:%c ${key}`, 'font-weight: bold;', 'font-weight: normal;');
    console.log('%cOld:', 'color: #e74c3c;', this.formatValue(oldValue));
    console.log('%cNew:', 'color: #27ae60;', this.formatValue(newValue));
    console.trace('Stack trace');
    console.groupEnd();
  }
  
  private formatValue(value: any): any {
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
      state: this.getStateSnapshot()
    };
    
    this.stateHistory.push(snapshot);
    
    // Keep only last 50 snapshots
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }
  }
  
  private getStateSnapshot(): any {
    const snapshot: any = {};
    
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
    
    console.group('%c🔍 Element Inspector', 'color: #3498db; font-weight: bold;');
    console.log('%cElement:', 'font-weight: bold;', element);
    console.log('%cDirectives:', 'font-weight: bold;');
    
    directives.forEach(directive => {
      console.log(`  ${directive.name}: ${directive.value}`);
    });
    
    console.groupEnd();
  }
  
  private getElementDirectives(element: Element): Array<{name: string, value: string}> {
    const directives: Array<{name: string, value: string}> = [];
    
    for (const attr of element.attributes) {
      if (attr.name.startsWith('uus-') || attr.name.startsWith(':') || attr.name.startsWith('@')) {
        directives.push({
          name: attr.name,
          value: attr.value
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
    
    console.log(
      `%c⏱️ ${name}: ${duration.toFixed(2)}ms`,
      'color: #27ae60;'
    );
    
    return duration;
  }
  
  /**
   * Find components by state property
   */
  findByState(property: string, value?: any) {
    const elements: Element[] = [];
    const allElements = document.querySelectorAll('[uus-state]');
    
    allElements.forEach(el => {
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
    elements.forEach(el => console.log(el));
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
    const directiveStr = directives.map(d => d.name).join(' ');
    
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
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        console.log(`%c📚 Imported ${data.history.length} history snapshots`, 'color: #27ae60;');
      }
    } catch (error) {
      console.error('Failed to import state:', error);
    }
  }
}

/**
 * Chrome Extension Bridge
 * Communicates with Uus.js DevTools Extension
 */
export class DevToolsExtensionBridge {
  private app: Uus;
  
  constructor(app: Uus) {
    this.app = app;
    this.init();
  }
  
  private init() {
    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      if (event.data.source !== 'uus-devtools-extension') return;
      
      this.handleMessage(event.data);
    });
    
    // Notify extension that app is ready
    this.sendMessage({
      type: 'init',
      data: {
        version: '0.0.1',
        state: this.getSerializableState()
      }
    });
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case 'get-state':
        this.sendState();
        break;
      case 'update-state':
        this.updateState(message.data);
        break;
      case 'time-travel':
        this.timeTravel(message.data);
        break;
      case 'inspect-element':
        this.inspectElement(message.data);
        break;
    }
  }
  
  private sendMessage(message: any) {
    window.postMessage({
      source: 'uus-devtools',
      ...message
    }, '*');
  }
  
  private sendState() {
    this.sendMessage({
      type: 'state-update',
      data: this.getSerializableState()
    });
  }
  
  private getSerializableState() {
    // Convert state to plain object for serialization
    const state: any = {};
    
    for (const key in this.app.state) {
      const value = this.app.state[key];
      state[key] = isReactive(value) ? toRaw(value) : value;
    }
    
    return state;
  }
  
  private updateState(updates: any) {
    Object.assign(this.app.state, updates);
  }
  
  private timeTravel(snapshot: any) {
    Object.assign(this.app.state, snapshot);
  }
  
  private inspectElement(selector: string) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const info = {
      selector,
      directives: this.getElementDirectives(element),
      state: this.getElementState(element)
    };
    
    this.sendMessage({
      type: 'element-info',
      data: info
    });
  }
  
  private getElementDirectives(element: Element) {
    const directives: any[] = [];
    
    for (const attr of element.attributes) {
      if (attr.name.startsWith('uus-') || attr.name.startsWith(':') || attr.name.startsWith('@')) {
        directives.push({
          name: attr.name,
          value: attr.value
        });
      }
    }
    
    return directives;
  }
  
  private getElementState(element: Element) {
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