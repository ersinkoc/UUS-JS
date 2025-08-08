/**
 * DevTools Module - Conditionally loadable for development
 * This module can be imported separately to avoid including it in production builds
 */

export { DevTools, type DevToolsConfig } from '../devtools';

// Lazy initialization helper
export function initializeDevTools() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    return import('../devtools').then(({ DevTools }) => DevTools);
  }
  return Promise.resolve(null);
}

// Check if DevTools should be enabled
export function shouldEnableDevTools(): boolean {
  return (
    typeof window !== 'undefined' &&
    (process.env.NODE_ENV === 'development' ||
      // Allow enabling via URL parameter
      new URLSearchParams(window.location.search).has('debug') ||
      // Allow enabling via localStorage
      localStorage.getItem('uus-devtools') === 'true')
  );
}
