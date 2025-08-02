/**
 * Performance Utilities - Optional module for performance optimization
 * Can be imported separately to reduce main bundle size
 */

export * from '../performance';

// Lazy loader for performance utilities
export function loadPerformanceUtils() {
  if (typeof window !== 'undefined') {
    return import('../performance');
  }
  return Promise.resolve(null);
}

// Performance monitoring helper
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  if (process.env.NODE_ENV === 'production') {
    return fn; // No monitoring in production by default
  }
  
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (console.groupCollapsed) {
      console.groupCollapsed(`⚡ ${name} (${(end - start).toFixed(2)}ms)`);
      console.log('Arguments:', args);
      console.log('Result:', result);
      console.groupEnd();
    }
    
    return result;
  }) as T;
}