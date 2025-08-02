import { bench, describe } from 'vitest';
import { memoryManager, ResourceTracker, CleanupRegistry, CircularReferenceManager } from '../src/memory';
import { leakDetector } from '../src/leak-detection';

describe('Memory Management Benchmarks', () => {
  bench('ResourceTracker - track/untrack resources', () => {
    const tracker = new ResourceTracker();
    const resources: string[] = [];
    
    // Track 1000 resources
    for (let i = 0; i < 1000; i++) {
      const id = tracker.track('component', { id: i }, () => {
        // Cleanup function
      });
      resources.push(id);
    }
    
    // Untrack all resources
    resources.forEach(id => tracker.untrack(id));
  });

  bench('ResourceTracker - cleanup dead references', () => {
    const tracker = new ResourceTracker();
    
    // Create resources with weak references
    for (let i = 0; i < 1000; i++) {
      let obj: any = { id: i };
      tracker.track('component', obj, () => {});
      obj = null; // Make eligible for GC
    }
    
    // Clean up dead references
    tracker.cleanupDeadRefs();
  });

  bench('CleanupRegistry - register/cleanup functions', () => {
    const registry = new CleanupRegistry();
    
    // Register 1000 cleanup functions
    for (let i = 0; i < 1000; i++) {
      registry.register(`component-${i}`, () => {
        // Cleanup logic
      });
    }
    
    // Execute all cleanups
    registry.cleanup();
  });

  bench('CleanupRegistry - timer management', () => {
    const registry = new CleanupRegistry();
    const timers: number[] = [];
    
    // Register 100 timers
    for (let i = 0; i < 100; i++) {
      const timerId = setTimeout(() => {}, 1000) as unknown as number;
      registry.registerTimer(timerId);
      timers.push(timerId);
    }
    
    // Clean up all timers
    registry.cleanup();
  });

  bench('CircularReferenceManager - detect circular references', () => {
    const manager = new CircularReferenceManager();
    
    // Create object with circular reference
    const obj: any = { a: 1, b: { c: 2 } };
    obj.b.parent = obj; // Circular reference
    
    // Detect circular references
    const path = manager.detectCircular(obj);
  });

  bench('CircularReferenceManager - break circular references', () => {
    const manager = new CircularReferenceManager();
    
    // Create complex circular structure
    const data: any = {
      users: [],
      posts: []
    };
    
    for (let i = 0; i < 10; i++) {
      const user = { id: i, posts: [] as any[] };
      const post = { id: i, author: user };
      user.posts.push(post);
      data.users.push(user);
      data.posts.push(post);
    }
    
    // Break circular references
    const safe = manager.breakCircular(data);
  });

  bench('MemoryManager - full lifecycle', () => {
    // Track resource
    const resourceId = memoryManager.track('component', { data: 'test' }, () => {
      // Cleanup
    });
    
    // Get stats
    const stats = memoryManager.getMemoryStats();
    
    // Untrack resource
    memoryManager.untrack(resourceId);
  });

  bench('MemoryManager - bulk operations', () => {
    const resources: string[] = [];
    
    // Track 1000 resources
    for (let i = 0; i < 1000; i++) {
      const id = memoryManager.track('component', { id: i }, () => {});
      resources.push(id);
    }
    
    // Get memory stats
    memoryManager.getMemoryStats();
    
    // Untrack all
    resources.forEach(id => memoryManager.untrack(id));
  });

  bench('LeakDetector - health check', () => {
    // Perform health check
    const report = leakDetector.performHealthCheck();
  });

  bench('WeakMap vs Map performance', () => {
    const weakMap = new WeakMap();
    const map = new Map();
    const objects = Array(1000).fill(0).map((_, i) => ({ id: i }));
    
    // WeakMap operations
    objects.forEach(obj => {
      weakMap.set(obj, { data: 'value' });
      weakMap.get(obj);
    });
    
    // Map operations
    objects.forEach(obj => {
      map.set(obj, { data: 'value' });
      map.get(obj);
    });
    
    // Clear Map (WeakMap doesn't need explicit clearing)
    map.clear();
  });

  bench('Memory pressure test', () => {
    const allocations: any[] = [];
    
    // Allocate memory
    for (let i = 0; i < 100; i++) {
      allocations.push({
        data: new Array(1000).fill(Math.random()),
        timestamp: Date.now(),
        id: `allocation-${i}`
      });
    }
    
    // Track with memory manager
    allocations.forEach(alloc => {
      memoryManager.track('allocation', alloc, () => {});
    });
    
    // Clear allocations
    allocations.length = 0;
    
    // Cleanup
    memoryManager.cleanupDeadReferences();
  });

  bench('Resource lifecycle with cleanup', () => {
    const tracker = new ResourceTracker();
    const registry = new CleanupRegistry();
    
    // Simulate component lifecycle
    for (let i = 0; i < 100; i++) {
      // Create component
      const component = { id: i, data: 'component data' };
      const resourceId = tracker.track('component', component, () => {
        registry.cleanup();
      });
      
      // Register cleanup
      registry.register(`component-${i}`, () => {
        // Component cleanup
      });
      
      // Register timer
      const timerId = setTimeout(() => {}, 1000) as unknown as number;
      registry.registerTimer(timerId);
      
      // Destroy component
      tracker.untrack(resourceId);
    }
  });

  bench('Memory stats calculation', () => {
    // Add various resources
    for (let i = 0; i < 100; i++) {
      memoryManager.track('component', { id: i }, () => {});
      memoryManager.track('proxy', new Proxy({}, {}), () => {});
      memoryManager.track('effect', () => {}, () => {});
    }
    
    // Calculate stats multiple times
    for (let i = 0; i < 10; i++) {
      const stats = memoryManager.getMemoryStats();
    }
    
    // Cleanup
    memoryManager.cleanupDeadReferences();
  });
});