/**
 * UUS.js Memory Management Examples
 * Demonstrates comprehensive memory leak prevention
 */

import { Uus, memoryManager, leakDetector, initLeakDetection } from '../index';

// Example 1: Basic UUS instance with memory tracking
export function createMemoryAwareApp() {
  // Create UUS instance with debug mode for memory tracking
  const app = new Uus({
    debug: true,
    onError: (error) => {
      console.error('App error:', error);
    }
  });

  // Register cleanup for when the app is no longer needed
  const cleanup = app.registerCleanup(() => {
    console.log('App cleanup function called');
  });

  // Mount to an element
  const element = document.getElementById('app');
  if (element) {
    app.mount(element);
  }

  // Return both app and cleanup function
  return { app, cleanup };
}

// Example 2: Long-running application with periodic cleanup
export function createLongRunningApp() {
  const app = new Uus({ debug: true });

  // Periodic memory cleanup
  const cleanupInterval = setInterval(() => {
    // Clean up dead references
    const cleanedRefs = app.cleanupDeadReferences();
    console.log(`Cleaned up ${cleanedRefs} dead references`);

    // Get memory stats
    const stats = app.getMemoryStats();
    console.log('Memory stats:', stats);

    // Force GC if memory usage is high
    if (stats.resources.totalResources > 1000) {
      console.warn('High resource count, triggering cleanup');
      memoryManager.resourceTracker.cleanupDeadRefs();
    }
  }, 60000); // Every minute

  // Register the interval for cleanup
  app.registerCleanup(() => {
    clearInterval(cleanupInterval);
  });

  return app;
}

// Example 3: Component with proper lifecycle management
export function createManagedComponent(element: HTMLElement) {
  // Use memory-aware component registration
  const { registerComponentWithTracking } = require('../lifecycle');

  const cleanup = registerComponentWithTracking(
    element,
    {
      created() {
        console.log('Component created');
      },
      mounted() {
        console.log('Component mounted');
        
        // Example: Add event listener that will be cleaned up
        const handleClick = () => {
          console.log('Component clicked');
        };
        
        element.addEventListener('click', handleClick);
        
        // Register cleanup for the event listener
        this.addCleanup(() => {
          element.removeEventListener('click', handleClick);
        });
      },
      updated() {
        console.log('Component updated');
      },
      destroyed() {
        console.log('Component destroyed');
      }
    }
  );

  return cleanup;
}

// Example 4: Abortable operations
export async function createAbortableOperation(app: Uus) {
  try {
    const result = await app.createAbortableOperation(async (signal) => {
      // Simulate long-running operation
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          resolve('Operation completed');
        }, 5000);

        // Listen for abort signal
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Operation aborted'));
        });
      });
    });

    console.log('Operation result:', result);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'Operation aborted') {
      console.log('Operation was aborted');
    } else {
      console.error('Operation failed:', error);
    }
    throw error;
  }
}

// Example 5: Memory leak detection setup
export function setupMemoryMonitoring() {
  // Initialize leak detection
  const detector = initLeakDetection(true);

  // Add custom leak detection listener
  const unsubscribe = detector.onReport((report) => {
    if (report.overall === 'critical') {
      console.error('🚨 Critical memory leaks detected!');
      
      // Send alert to monitoring service
      sendMemoryAlert(report);
      
      // Attempt automatic cleanup
      attemptAutomaticCleanup();
    } else if (report.overall === 'warning') {
      console.warn('⚠️ Memory warnings detected');
      console.table(report.leaks);
    }
  });

  return {
    detector,
    unsubscribe,
    getHealthReport: () => detector.performHealthCheck()
  };
}

// Example 6: Reactive system with circular reference prevention
export function createSafeReactiveData() {
  const { createReactive, deepReactive, CircularReferenceManager } = require('../reactive');
  
  const circularManager = new CircularReferenceManager();

  // Create data that might have circular references
  const data = {
    user: {
      name: 'John',
      posts: [] as any[]
    },
    posts: [] as any[]
  };

  // Add some posts with potential circular references
  const post1 = { id: 1, title: 'Post 1', author: data.user };
  const post2 = { id: 2, title: 'Post 2', author: data.user };
  
  data.user.posts.push(post1, post2);
  data.posts.push(post1, post2);

  // Check for circular references before making reactive
  const circularPath = circularManager.detectCircular(data);
  if (circularPath) {
    console.warn('Circular reference detected:', circularPath);
    
    // Break circular references
    const safedData = circularManager.breakCircular(data);
    return createReactive(safedData);
  }

  return deepReactive(data, new WeakSet(), 5); // Limit depth to 5
}

// Example 7: Memory pressure testing
export async function runMemoryTest() {
  console.log('🧪 Starting memory pressure test...');
  
  const { runMemoryPressureTest } = require('../leak-detection');
  
  try {
    const report = await runMemoryPressureTest(10000); // 10 second test
    
    console.log('Memory test results:');
    console.log('- Overall health:', report.overall);
    console.log('- Total resources:', report.stats.totalResources);
    console.log('- Memory usage:', (report.stats.memoryUsage / 1024 / 1024).toFixed(2), 'MB');
    console.log('- Leaks found:', report.leaks.length);
    
    if (report.recommendations.length > 0) {
      console.log('Recommendations:');
      report.recommendations.forEach((rec: string) => console.log(`- ${rec}`));
    }
    
    return report;
  } catch (error) {
    console.error('Memory test failed:', error);
    throw error;
  }
}

// Example 8: Complete application lifecycle
export function createCompleteApp() {
  // 1. Setup memory monitoring
  const monitoring = setupMemoryMonitoring();
  
  // 2. Create app with memory tracking
  const app = new Uus({
    debug: true,
    onError: (error) => {
      console.error('App error:', error);
      
      // Check if error might be memory-related
      if (error.message.includes('memory') || error.message.includes('leak')) {
        monitoring.detector.performHealthCheck();
      }
    }
  });

  // 3. Setup periodic health checks
  const healthCheckInterval = setInterval(() => {
    const report = monitoring.getHealthReport();
    
    if (report.overall !== 'healthy') {
      console.log('Health check:', report.overall);
    }
  }, 30000); // Every 30 seconds

  // 4. Register cleanup
  app.registerCleanup(() => {
    clearInterval(healthCheckInterval);
    monitoring.unsubscribe();
    monitoring.detector.destroy();
    console.log('Complete app cleanup finished');
  });

  // 5. Return app interface
  return {
    app,
    monitoring,
    
    // Method to get current memory status
    getMemoryStatus() {
      return {
        app: app.getMemoryStats(),
        global: memoryManager.getMemoryStats(),
        health: monitoring.getHealthReport()
      };
    },
    
    // Method to force cleanup
    forceCleanup() {
      app.cleanupDeadReferences();
      memoryManager.resourceTracker.cleanupDeadRefs();
      return this.getMemoryStatus();
    },
    
    // Method to destroy everything
    destroy() {
      app.destroy();
      console.log('App destroyed successfully');
    }
  };
}

// Helper functions
function sendMemoryAlert(report: any) {
  // In a real app, this would send to your monitoring service
  console.error('Sending memory alert:', {
    timestamp: report.timestamp,
    severity: report.overall,
    leakCount: report.leaks.length,
    memoryUsage: report.stats.memoryUsage
  });
}

function attemptAutomaticCleanup() {
  console.log('Attempting automatic cleanup...');
  
  try {
    // Clean up dead references
    const cleaned = memoryManager.resourceTracker.cleanupDeadRefs();
    console.log(`Cleaned up ${cleaned} dead references`);
    
    // Force garbage collection if available
    const { forceGC } = require('../leak-detection');
    if (forceGC()) {
      console.log('Forced garbage collection');
    }
    
    return true;
  } catch (error) {
    console.error('Automatic cleanup failed:', error);
    return false;
  }
}

// Usage examples:

/*
// Basic usage
const { app, cleanup } = createMemoryAwareApp();

// When done
cleanup();
app.destroy();

// Complete application
const completeApp = createCompleteApp();

// Check memory status
console.log(completeApp.getMemoryStatus());

// Force cleanup if needed
completeApp.forceCleanup();

// Destroy when done
completeApp.destroy();

// Memory testing during development
if (process.env.NODE_ENV === 'development') {
  runMemoryTest().then(report => {
    console.log('Memory test completed:', report);
  });
}
*/