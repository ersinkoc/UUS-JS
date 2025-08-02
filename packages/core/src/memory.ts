/**
 * UUS.js Memory Management System
 * Comprehensive memory leak prevention and resource tracking
 */

// Resource tracking types
export interface TrackedResource {
  id: string;
  type: ResourceType;
  created: number;
  element?: WeakRef<HTMLElement>;
  cleanup?: () => void;
  metadata?: Record<string, unknown>;
}

export type ResourceType = 
  | 'effect' 
  | 'eventListener' 
  | 'observer' 
  | 'timer' 
  | 'component' 
  | 'directive'
  | 'asyncOperation'
  | 'proxy';

export interface MemoryStats {
  totalResources: number;
  byType: Record<ResourceType, number>;
  oldestResource: number;
  memoryUsage?: number;
}

export interface LeakDetectionConfig {
  enabled: boolean;
  checkInterval: number;
  maxResourceAge: number;
  maxResourceCount: number;
  onLeakDetected?: (leaks: TrackedResource[]) => void;
}

/**
 * Resource tracker for memory leak prevention
 */
export class ResourceTracker {
  private resources = new Map<string, TrackedResource>();
  private weakRefs = new Set<WeakRef<object>>();
  private cleanupCallbacks = new Set<() => void>();
  private leakDetectionConfig: LeakDetectionConfig;
  private leakCheckTimer?: number;
  private resourceCounter = 0;

  constructor(config?: Partial<LeakDetectionConfig>) {
    this.leakDetectionConfig = {
      enabled: process.env.NODE_ENV !== 'production',
      checkInterval: 30000, // 30 seconds
      maxResourceAge: 300000, // 5 minutes
      maxResourceCount: 1000,
      ...config
    };

    if (this.leakDetectionConfig.enabled) {
      this.startLeakDetection();
    }
  }

  /**
   * Track a new resource
   */
  track<T extends object = object>(
    type: ResourceType,
    resource?: T,
    cleanup?: () => void,
    metadata?: Record<string, unknown>
  ): string {
    const id = `${type}-${++this.resourceCounter}-${Date.now()}`;
    
    const tracked: TrackedResource = {
      id,
      type,
      created: Date.now(),
      cleanup,
      metadata
    };

    // Use WeakRef for DOM elements to prevent memory leaks
    if (resource instanceof HTMLElement) {
      tracked.element = new WeakRef(resource);
      this.weakRefs.add(tracked.element);
    }

    this.resources.set(id, tracked);

    if (cleanup) {
      this.cleanupCallbacks.add(cleanup);
    }

    return id;
  }

  /**
   * Untrack and cleanup a resource
   */
  untrack(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) return false;

    // Run cleanup if available
    if (resource.cleanup) {
      try {
        resource.cleanup();
        this.cleanupCallbacks.delete(resource.cleanup);
      } catch (error) {
        console.warn('Error during resource cleanup:', error);
      }
    }

    // Clean up WeakRef
    if (resource.element) {
      this.weakRefs.delete(resource.element);
    }

    this.resources.delete(id);
    return true;
  }

  /**
   * Cleanup all resources of a specific type
   */
  cleanupByType(type: ResourceType): number {
    let cleaned = 0;
    const toRemove: string[] = [];

    for (const [id, resource] of this.resources) {
      if (resource.type === type) {
        if (this.untrack(id)) {
          cleaned++;
        }
        toRemove.push(id);
      }
    }

    return cleaned;
  }

  /**
   * Cleanup all tracked resources
   */
  cleanupAll(): void {
    const resourceIds = Array.from(this.resources.keys());
    
    for (const id of resourceIds) {
      this.untrack(id);
    }

    // Clear any remaining collections
    this.resources.clear();
    this.weakRefs.clear();
    this.cleanupCallbacks.clear();

    if (this.leakCheckTimer) {
      clearInterval(this.leakCheckTimer);
      this.leakCheckTimer = undefined;
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const byType: Record<ResourceType, number> = {
      effect: 0,
      eventListener: 0,
      observer: 0,
      timer: 0,
      component: 0,
      directive: 0,
      asyncOperation: 0,
      proxy: 0
    };

    let oldestResource = Date.now();

    for (const resource of this.resources.values()) {
      byType[resource.type]++;
      if (resource.created < oldestResource) {
        oldestResource = resource.created;
      }
    }

    const stats: MemoryStats = {
      totalResources: this.resources.size,
      byType,
      oldestResource
    };

    // Add memory usage if available
    if ((performance as any).memory) {
      stats.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    return stats;
  }

  /**
   * Detect potential memory leaks
   */
  detectLeaks(): TrackedResource[] {
    const now = Date.now();
    const leaks: TrackedResource[] = [];

    for (const resource of this.resources.values()) {
      const age = now - resource.created;
      
      // Check for old resources
      if (age > this.leakDetectionConfig.maxResourceAge) {
        leaks.push(resource);
      }

      // Check if WeakRef is still alive for DOM elements
      if (resource.element && !resource.element.deref()) {
        // Element was garbage collected but resource wasn't cleaned up
        leaks.push(resource);
      }
    }

    // Check total resource count
    if (this.resources.size > this.leakDetectionConfig.maxResourceCount) {
      console.warn(`High resource count detected: ${this.resources.size} resources`);
    }

    return leaks;
  }

  /**
   * Start automatic leak detection
   */
  private startLeakDetection(): void {
    if (this.leakCheckTimer) return;

    this.leakCheckTimer = window.setInterval(() => {
      const leaks = this.detectLeaks();
      
      if (leaks.length > 0) {
        console.warn(`Memory leaks detected: ${leaks.length} resources`);
        console.table(leaks.map(leak => ({
          id: leak.id,
          type: leak.type,
          age: Date.now() - leak.created,
          metadata: leak.metadata
        })));

        if (this.leakDetectionConfig.onLeakDetected) {
          this.leakDetectionConfig.onLeakDetected(leaks);
        }

        // Auto-cleanup detected leaks
        for (const leak of leaks) {
          this.untrack(leak.id);
        }
      }
    }, this.leakDetectionConfig.checkInterval);
  }

  /**
   * Force garbage collection of dead WeakRefs (if available)
   */
  cleanupDeadRefs(): number {
    let cleaned = 0;
    const deadRefs = new Set<WeakRef<object>>();

    for (const ref of this.weakRefs) {
      if (!ref.deref()) {
        deadRefs.add(ref);
        cleaned++;
      }
    }

    for (const deadRef of deadRefs) {
      this.weakRefs.delete(deadRef);
    }

    return cleaned;
  }
}

/**
 * Cleanup registry for managing cleanup functions
 */
export class CleanupRegistry {
  private cleanupFunctions = new Set<() => void>();
  private timers = new Set<number>();
  private abortControllers = new Set<AbortController>();
  private observers = new Set<MutationObserver | ResizeObserver | PerformanceObserver>();

  /**
   * Register a cleanup function
   */
  register(cleanup: () => void): () => void {
    this.cleanupFunctions.add(cleanup);
    
    // Return unregister function
    return () => {
      this.cleanupFunctions.delete(cleanup);
    };
  }

  /**
   * Register a timer for cleanup
   */
  registerTimer(timerId: number): () => void {
    this.timers.add(timerId);
    
    return () => {
      clearTimeout(timerId);
      clearInterval(timerId);
      this.timers.delete(timerId);
    };
  }

  /**
   * Register an AbortController
   */
  registerAbortController(controller: AbortController): () => void {
    this.abortControllers.add(controller);
    
    return () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
      this.abortControllers.delete(controller);
    };
  }

  /**
   * Register an observer
   */
  registerObserver(
    observer: MutationObserver | ResizeObserver | PerformanceObserver
  ): () => void {
    this.observers.add(observer);
    
    return () => {
      observer.disconnect();
      this.observers.delete(observer);
    };
  }

  /**
   * Execute all cleanup functions and clear registry
   */
  cleanup(): void {
    // Run all cleanup functions
    for (const cleanup of this.cleanupFunctions) {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    }

    // Clear all timers
    for (const timerId of this.timers) {
      clearTimeout(timerId);
      clearInterval(timerId);
    }

    // Abort all controllers
    for (const controller of this.abortControllers) {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }

    // Disconnect all observers
    for (const observer of this.observers) {
      observer.disconnect();
    }

    // Clear all collections
    this.cleanupFunctions.clear();
    this.timers.clear();
    this.abortControllers.clear();
    this.observers.clear();
  }

  /**
   * Get current registry stats
   */
  getStats() {
    return {
      cleanupFunctions: this.cleanupFunctions.size,
      timers: this.timers.size,
      abortControllers: this.abortControllers.size,
      observers: this.observers.size
    };
  }
}

/**
 * Circular reference detector and breaker
 */
export class CircularReferenceManager {
  private visited = new WeakSet<object>();
  private processing = new WeakSet<object>();

  /**
   * Detect circular references in an object graph
   */
  detectCircular(obj: unknown, path: string[] = []): string[] | null {
    if (obj === null || typeof obj !== 'object') {
      return null;
    }

    const objectRef = obj as object;

    if (this.processing.has(objectRef)) {
      return path; // Circular reference found
    }

    if (this.visited.has(objectRef)) {
      return null; // Already processed
    }

    this.processing.add(objectRef);

    try {
      for (const [key, value] of Object.entries(objectRef)) {
        const circular = this.detectCircular(value, [...path, key]);
        if (circular) {
          return circular;
        }
      }

      this.visited.add(objectRef);
      return null;
    } finally {
      this.processing.delete(objectRef);
    }
  }

  /**
   * Break circular references by replacing with WeakRef
   */
  breakCircular(obj: object, maxDepth = 10): object {
    const seen = new WeakMap<object, WeakRef<object>>();
    
    const process = (current: unknown, depth: number): unknown => {
      if (depth > maxDepth || current === null || typeof current !== 'object') {
        return current;
      }

      const currentObj = current as object;
      
      if (seen.has(currentObj)) {
        // Return WeakRef to break circular reference
        return seen.get(currentObj)!;
      }

      const weakRef = new WeakRef(currentObj);
      seen.set(currentObj, weakRef);

      if (Array.isArray(currentObj)) {
        return currentObj.map(item => process(item, depth + 1));
      }

      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(currentObj)) {
        result[key] = process(value, depth + 1);
      }

      return result;
    };

    return process(obj, 0) as object;
  }

  /**
   * Clear tracking state
   */
  clear(): void {
    // WeakSets will be garbage collected automatically
    this.visited = new WeakSet();
    this.processing = new WeakSet();
  }
}

/**
 * Global memory manager instance
 */
export const memoryManager = {
  resourceTracker: new ResourceTracker(),
  cleanupRegistry: new CleanupRegistry(),
  circularRefManager: new CircularReferenceManager(),

  /**
   * Initialize memory management for a UUS instance
   */
  init(instanceId: string = 'default') {
    console.log(`🧠 Memory management initialized for instance: ${instanceId}`);
    return {
      track: this.resourceTracker.track.bind(this.resourceTracker),
      untrack: this.resourceTracker.untrack.bind(this.resourceTracker),
      cleanup: this.cleanupRegistry.register.bind(this.cleanupRegistry),
      stats: () => ({
        resources: this.resourceTracker.getStats(),
        registry: this.cleanupRegistry.getStats()
      })
    };
  },

  /**
   * Cleanup everything for an instance
   */
  destroy(instanceId: string = 'default') {
    console.log(`🧠 Cleaning up memory for instance: ${instanceId}`);
    this.resourceTracker.cleanupAll();
    this.cleanupRegistry.cleanup();
    this.circularRefManager.clear();
  },

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      resources: this.resourceTracker.getStats(),
      registry: this.cleanupRegistry.getStats(),
      ...(typeof window !== 'undefined' && (window.performance as any).memory 
        ? { heap: (window.performance as any).memory }
        : {})
    };
  }
};