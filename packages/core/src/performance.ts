/**
 * Performance optimization utilities for Uus.js
 */

import { effect, isRef, isReactive } from './reactive';

/**
 * Batch multiple updates together
 */
export class UpdateBatcher {
  private pending = false;
  private queue: Set<() => void> = new Set();
  
  add(fn: () => void) {
    this.queue.add(fn);
    
    if (!this.pending) {
      this.pending = true;
      queueMicrotask(() => this.flush());
    }
  }
  
  flush() {
    const fns = Array.from(this.queue);
    this.queue.clear();
    this.pending = false;
    
    fns.forEach(fn => fn());
  }
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = function(this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  } as T;
  
  (debounced as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced as T & { cancel: () => void };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  
  const throttled = function(this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;
    
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      
      timeoutId = setTimeout(() => {
        inThrottle = false;
        if (lastArgs !== null) {
          throttled.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    }
  } as T;
  
  (throttled as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    inThrottle = false;
    lastArgs = null;
    lastThis = null;
  };
  
  return throttled as T & { cancel: () => void };
}

/**
 * Memoize a function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    maxSize?: number;
    keyFn?: (...args: Parameters<T>) => string;
  }
): T {
  const cache = new Map<string, ReturnType<T>>();
  const maxSize = options?.maxSize ?? Infinity;
  const keyFn = options?.keyFn ?? ((...args) => JSON.stringify(args));
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      // Move to end (LRU)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Evict oldest if over max size
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  } as T;
}

/**
 * Lazy evaluation
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T;
  let computed = false;
  
  return () => {
    if (!computed) {
      value = factory();
      computed = true;
    }
    return value;
  };
}

/**
 * Virtual list for rendering large datasets
 */
export interface VirtualListOptions {
  itemHeight: number;
  buffer?: number;
  container?: HTMLElement;
}

export class VirtualList<T> {
  private items: T[] = [];
  private itemHeight: number;
  private buffer: number;
  private container: HTMLElement;
  private scrollHandler: () => void;
  private visibleRange = { start: 0, end: 0 };
  
  constructor(options: VirtualListOptions) {
    this.itemHeight = options.itemHeight;
    this.buffer = options.buffer ?? 5;
    this.container = options.container ?? document.body;
    
    this.scrollHandler = throttle(() => this.updateVisibleRange(), 100);
    this.container.addEventListener('scroll', this.scrollHandler);
  }
  
  setItems(items: T[]) {
    this.items = items;
    this.updateVisibleRange();
  }
  
  private updateVisibleRange() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const end = Math.min(
      this.items.length,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer
    );
    
    this.visibleRange = { start, end };
  }
  
  getVisibleItems(): Array<T & { index: number; offset: number }> {
    const { start, end } = this.visibleRange;
    
    return this.items.slice(start, end).map((item, i) => ({
      ...item,
      index: start + i,
      offset: (start + i) * this.itemHeight
    }));
  }
  
  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
    (this.scrollHandler as any).cancel();
  }
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = 
  (window as any).requestIdleCallback ||
  function(cb: IdleRequestCallback) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      } as IdleDeadline);
    }, 1);
  };

export const cancelIdleCallback =
  (window as any).cancelIdleCallback ||
  function(id: number) {
    clearTimeout(id);
  };

/**
 * Defer non-critical work
 */
export function defer(fn: () => void) {
  return requestIdleCallback(() => fn());
}

/**
 * Memory optimization - weak memoization
 */
export function weakMemoize<T extends object, R>(
  fn: (arg: T) => R
): (arg: T) => R {
  const cache = new WeakMap<T, R>();
  
  return (arg: T) => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

/**
 * Intersection observer for lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver;
  private callbacks = new WeakMap<Element, () => void>();
  
  constructor(options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, options);
  }
  
  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }
  
  unobserve(element: Element) {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }
  
  disconnect() {
    this.observer.disconnect();
    this.callbacks = new WeakMap();
  }
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures: Array<{ name: string; duration: number }> = [];
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Mark "${startMark}" not found`);
      return;
    }
    
    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      console.warn(`Mark "${endMark}" not found`);
      return;
    }
    
    const duration = end - start;
    this.measures.push({ name, duration });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  getReport() {
    return {
      marks: Array.from(this.marks.entries()),
      measures: [...this.measures]
    };
  }
  
  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private trackedObjects = new WeakSet<object>();
  private retainedObjects = new Set<WeakRef<object>>();
  
  track(obj: object) {
    this.trackedObjects.add(obj);
    this.retainedObjects.add(new WeakRef(obj));
  }
  
  checkLeaks(): Array<object> {
    // Force garbage collection if available (Chrome with --expose-gc flag)
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
    }
    
    const leaks: Array<object> = [];
    
    this.retainedObjects.forEach(ref => {
      const obj = ref.deref();
      if (obj && !this.trackedObjects.has(obj)) {
        leaks.push(obj);
      }
    });
    
    // Clean up dead references
    this.retainedObjects = new Set(
      Array.from(this.retainedObjects).filter(ref => ref.deref() !== undefined)
    );
    
    return leaks;
  }
  
  clear() {
    this.trackedObjects = new WeakSet();
    this.retainedObjects.clear();
  }
}

/**
 * Optimize reactive computations
 */
export function optimizeComputed<T>(
  computation: () => T,
  equals?: (a: T, b: T) => boolean
): () => T {
  let value: T;
  let dirty = true;
  const defaultEquals = (a: T, b: T) => a === b;
  const isEqual = equals ?? defaultEquals;
  
  const optimized = () => {
    if (dirty) {
      const newValue = computation();
      if (!isEqual(value, newValue)) {
        value = newValue;
      }
      dirty = false;
    }
    return value;
  };
  
  // Track dependencies
  effect(() => {
    computation();
    dirty = true;
  });
  
  return optimized;
}