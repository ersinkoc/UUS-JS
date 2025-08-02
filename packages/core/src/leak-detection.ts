/**
 * UUS.js Memory Leak Detection System
 * Advanced leak detection and prevention utilities
 */

import { memoryManager } from './memory';

export interface LeakReport {
  type: 'circular' | 'orphaned' | 'timeout' | 'listener' | 'observer';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  count: number;
  evidence: unknown[];
  suggestions: string[];
  memoryImpact: number; // Estimated bytes
}

export interface MemoryHealthReport {
  timestamp: number;
  overall: 'healthy' | 'warning' | 'critical';
  leaks: LeakReport[];
  stats: {
    totalResources: number;
    memoryUsage: number;
    oldestResourceAge: number;
  };
  recommendations: string[];
}

/**
 * Advanced memory leak detector
 */
export class MemoryLeakDetector {
  private checkInterval = 30000; // 30 seconds
  private intervalId?: number;
  private isRunning = false;
  private listeners: Array<(report: MemoryHealthReport) => void> = [];

  constructor(checkIntervalMs = 30000) {
    this.checkInterval = checkIntervalMs;
  }

  /**
   * Start continuous leak detection
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = window.setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    console.log('🔍 Memory leak detection started');
  }

  /**
   * Stop leak detection
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🔍 Memory leak detection stopped');
  }

  /**
   * Add a listener for health reports
   */
  onReport(listener: (report: MemoryHealthReport) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Perform immediate health check
   */
  performHealthCheck(): MemoryHealthReport {
    const leaks: LeakReport[] = [];
    const stats = memoryManager.getMemoryStats();

    // Check for orphaned DOM references
    leaks.push(...this.detectOrphanedDOMReferences());

    // Check for circular references
    leaks.push(...this.detectCircularReferences());

    // Check for timeout/interval leaks
    leaks.push(...this.detectTimeoutLeaks());

    // Check for event listener leaks
    leaks.push(...this.detectEventListenerLeaks());

    // Check for observer leaks
    leaks.push(...this.detectObserverLeaks());

    // Determine overall health
    const criticalLeaks = leaks.filter(leak => leak.severity === 'critical');
    const highLeaks = leaks.filter(leak => leak.severity === 'high');
    
    let overall: 'healthy' | 'warning' | 'critical';
    if (criticalLeaks.length > 0) {
      overall = 'critical';
    } else if (highLeaks.length > 0 || leaks.length > 10) {
      overall = 'warning';
    } else {
      overall = 'healthy';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(leaks, stats);

    const report: MemoryHealthReport = {
      timestamp: Date.now(),
      overall,
      leaks,
      stats: {
        totalResources: stats.resources.totalResources,
        memoryUsage: stats.heap?.usedJSHeapSize || 0,
        oldestResourceAge: Date.now() - stats.resources.oldestResource
      },
      recommendations
    };

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.warn('Error in leak detection listener:', error);
      }
    });

    // Log critical issues
    if (overall === 'critical') {
      console.error('🚨 Critical memory leaks detected!', report);
    } else if (overall === 'warning') {
      console.warn('⚠️ Memory issues detected', report);
    }

    return report;
  }

  /**
   * Detect orphaned DOM references
   */
  private detectOrphanedDOMReferences(): LeakReport[] {
    const leaks: LeakReport[] = [];
    
    try {
      // Check for detached DOM nodes
      const detachedNodes = this.findDetachedDOMNodes();
      
      if (detachedNodes.length > 0) {
        leaks.push({
          type: 'orphaned',
          severity: detachedNodes.length > 10 ? 'high' : 'medium',
          description: `Found ${detachedNodes.length} detached DOM nodes`,
          count: detachedNodes.length,
          evidence: detachedNodes.slice(0, 5), // Sample
          suggestions: [
            'Remove event listeners before removing DOM elements',
            'Clear references to DOM elements after removal',
            'Use WeakMap for element-to-data associations'
          ],
          memoryImpact: detachedNodes.length * 1000 // Rough estimate
        });
      }
    } catch (error) {
      console.warn('Error detecting orphaned DOM references:', error);
    }

    return leaks;
  }

  /**
   * Detect circular references
   */
  private detectCircularReferences(): LeakReport[] {
    const leaks: LeakReport[] = [];
    
    try {
      // Use the circular reference manager to detect cycles
      const circularPaths = this.findCircularReferences();
      
      if (circularPaths.length > 0) {
        leaks.push({
          type: 'circular',
          severity: 'high',
          description: `Detected ${circularPaths.length} circular references`,
          count: circularPaths.length,
          evidence: circularPaths,
          suggestions: [
            'Use WeakRef to break circular references',
            'Implement proper cleanup in component unmounting',
            'Avoid storing parent references in child objects'
          ],
          memoryImpact: circularPaths.length * 5000 // Rough estimate
        });
      }
    } catch (error) {
      console.warn('Error detecting circular references:', error);
    }

    return leaks;
  }

  /**
   * Detect timeout/interval leaks
   */
  private detectTimeoutLeaks(): LeakReport[] {
    const leaks: LeakReport[] = [];
    
    try {
      // Check registry stats
      const registryStats = memoryManager.cleanupRegistry.getStats();
      
      if (registryStats.timers > 50) {
        leaks.push({
          type: 'timeout',
          severity: registryStats.timers > 100 ? 'high' : 'medium',
          description: `High number of active timers: ${registryStats.timers}`,
          count: registryStats.timers,
          evidence: [`${registryStats.timers} active timers`],
          suggestions: [
            'Clear timeouts and intervals when components unmount',
            'Use AbortController for cancellable operations',
            'Register timers with cleanup registry'
          ],
          memoryImpact: registryStats.timers * 100
        });
      }
    } catch (error) {
      console.warn('Error detecting timeout leaks:', error);
    }

    return leaks;
  }

  /**
   * Detect event listener leaks
   */
  private detectEventListenerLeaks(): LeakReport[] {
    const leaks: LeakReport[] = [];
    
    try {
      // Check for excessive event listeners
      const listenerCount = this.estimateEventListenerCount();
      
      if (listenerCount > 100) {
        leaks.push({
          type: 'listener',
          severity: listenerCount > 500 ? 'critical' : 'high',
          description: `Estimated ${listenerCount} event listeners attached`,
          count: listenerCount,
          evidence: [`~${listenerCount} event listeners`],
          suggestions: [
            'Remove event listeners in directive unbind methods',
            'Use event delegation for dynamic content',
            'Track listeners with cleanup functions'
          ],
          memoryImpact: listenerCount * 500
        });
      }
    } catch (error) {
      console.warn('Error detecting event listener leaks:', error);
    }

    return leaks;
  }

  /**
   * Detect observer leaks
   */
  private detectObserverLeaks(): LeakReport[] {
    const leaks: LeakReport[] = [];
    
    try {
      const registryStats = memoryManager.cleanupRegistry.getStats();
      
      if (registryStats.observers > 10) {
        leaks.push({
          type: 'observer',
          severity: 'medium',
          description: `High number of active observers: ${registryStats.observers}`,
          count: registryStats.observers,
          evidence: [`${registryStats.observers} active observers`],
          suggestions: [
            'Disconnect observers when components unmount',
            'Register observers with cleanup registry',
            'Avoid creating duplicate observers'
          ],
          memoryImpact: registryStats.observers * 1000
        });
      }
    } catch (error) {
      console.warn('Error detecting observer leaks:', error);
    }

    return leaks;
  }

  /**
   * Find detached DOM nodes (simplified heuristic)
   */
  private findDetachedDOMNodes(): Element[] {
    const detached: Element[] = [];
    
    try {
      // This is a simplified approach - in practice, detecting truly detached
      // nodes is complex and may require browser-specific APIs
      const allElements = document.querySelectorAll('*');
      const connectedElements = document.querySelectorAll('html *');
      
      // Rough heuristic: if there's a significant difference, there might be detached nodes
      const potentialDetached = allElements.length - connectedElements.length;
      
      if (potentialDetached > 0) {
        // Return a placeholder for the count
        for (let i = 0; i < Math.min(potentialDetached, 10); i++) {
          detached.push(document.createElement('div')); // Placeholder
        }
      }
    } catch (error) {
      console.warn('Error finding detached DOM nodes:', error);
    }
    
    return detached;
  }

  /**
   * Find circular references (simplified)
   */
  private findCircularReferences(): string[] {
    const paths: string[] = [];
    
    try {
      // This is a simplified implementation
      // In practice, you'd traverse object graphs looking for cycles
      const resourceStats = memoryManager.getMemoryStats();
      
      // If we have a high number of proxy resources, there might be circular refs
      if (resourceStats.resources.byType.proxy > 20) {
        paths.push('proxy-circular-reference-detected');
      }
    } catch (error) {
      console.warn('Error finding circular references:', error);
    }
    
    return paths;
  }

  /**
   * Estimate event listener count (heuristic)
   */
  private estimateEventListenerCount(): number {
    try {
      // This is a rough estimate based on elements with common event attributes
      const elementsWithEvents = document.querySelectorAll('[onclick], [onchange], [onsubmit]');
      const elementsWithDataAttributes = document.querySelectorAll('[data-event], [uus-on]');
      
      return elementsWithEvents.length + elementsWithDataAttributes.length;
    } catch (error) {
      console.warn('Error estimating event listener count:', error);
      return 0;
    }
  }

  /**
   * Generate recommendations based on detected issues
   */
  private generateRecommendations(leaks: LeakReport[], stats: any): string[] {
    const recommendations: string[] = [];
    
    // General recommendations
    if (leaks.length > 0) {
      recommendations.push('Implement comprehensive cleanup in component lifecycle');
      recommendations.push('Use WeakMap and WeakRef for loose coupling');
    }
    
    // Memory usage recommendations
    if (stats.heap?.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected - consider pagination or virtualization');
    }
    
    // Resource count recommendations
    if (stats.resources.totalResources > 1000) {
      recommendations.push('High resource count - implement resource pooling');
    }
    
    // Age-based recommendations
    if (stats.resources.oldestResourceAge > 10 * 60 * 1000) { // 10 minutes
      recommendations.push('Long-lived resources detected - verify cleanup is working');
    }
    
    return recommendations;
  }

  /**
   * Clean up detector resources
   */
  destroy(): void {
    this.stop();
    this.listeners = [];
  }
}

/**
 * Global leak detector instance
 */
export const leakDetector = new MemoryLeakDetector();

/**
 * Initialize leak detection for development
 */
export function initLeakDetection(autoStart = true): MemoryLeakDetector {
  if (process.env.NODE_ENV === 'development' && autoStart) {
    leakDetector.start();
    
    // Log periodic reports
    leakDetector.onReport((report) => {
      if (report.overall !== 'healthy') {
        console.group('🔍 Memory Health Report');
        console.log('Overall:', report.overall);
        console.log('Leaks found:', report.leaks.length);
        console.table(report.leaks.map(leak => ({
          type: leak.type,
          severity: leak.severity,
          count: leak.count,
          description: leak.description
        })));
        console.log('Recommendations:', report.recommendations);
        console.groupEnd();
      }
    });
  }
  
  return leakDetector;
}

/**
 * Force garbage collection if available (for testing)
 */
export function forceGC(): boolean {
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      (window as any).gc();
      return true;
    } catch (error) {
      console.warn('Could not force garbage collection:', error);
    }
  }
  return false;
}

/**
 * Memory pressure test utility
 */
export function runMemoryPressureTest(durationMs = 5000): Promise<MemoryHealthReport> {
  return new Promise((resolve) => {
    console.log('🧪 Starting memory pressure test...');
    
    const initialReport = leakDetector.performHealthCheck();
    
    // Create some memory pressure
    const testObjects: any[] = [];
    const testInterval = setInterval(() => {
      for (let i = 0; i < 1000; i++) {
        testObjects.push({
          data: new Array(1000).fill(Math.random()),
          timestamp: Date.now(),
          id: `test-${i}-${Date.now()}`
        });
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(testInterval);
      
      // Clear test objects
      testObjects.length = 0;
      
      // Force GC if available
      forceGC();
      
      // Wait a bit for cleanup
      setTimeout(() => {
        const finalReport = leakDetector.performHealthCheck();
        console.log('🧪 Memory pressure test completed');
        resolve(finalReport);
      }, 1000);
    }, durationMs);
  });
}