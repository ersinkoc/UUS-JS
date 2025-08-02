import { Uus } from '@uusjs/core';
import { HydrationOptions } from './types';

/**
 * Hydrate a server-rendered app
 */
export function hydrate(
  app: Uus,
  container: string | Element = '#app',
  options?: HydrationOptions
): void {
  const element = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
    
  if (!element) {
    throw new Error(`Hydration container not found: ${container}`);
  }

  // Restore state from server
  const serverState = (window as any).__UUS_STATE__;
  if (serverState) {
    try {
      const state = JSON.parse(serverState);
      Object.assign(app.state, state);
    } catch (error) {
      console.error('Failed to restore server state:', error);
    }
  }

  // Mark as hydrating
  (app as any).__hydrating = true;

  // Find SSR markers
  const ssrElements = element.querySelectorAll('[data-uus-ssr]');
  
  // Verify hydration match
  if (!options?.suppressWarnings) {
    verifyHydration(element, ssrElements);
  }

  // Mount with hydration
  app.mount(element);

  // Remove SSR markers
  ssrElements.forEach(el => {
    el.removeAttribute('data-uus-ssr');
  });

  // Mark hydration complete
  (app as any).__hydrating = false;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Hydration complete');
  }
}

/**
 * Verify hydration matches server output
 */
function verifyHydration(container: Element, ssrElements: NodeListOf<Element>): void {
  const warnings: string[] = [];
  
  // Check for hydration mismatches
  ssrElements.forEach(el => {
    const directives = getDirectives(el);
    
    directives.forEach(({ name, value }) => {
      // Verify directive values match
      const serverValue = el.getAttribute(name);
      if (serverValue !== value) {
        warnings.push(
          `Hydration mismatch on ${el.tagName}: ` +
          `${name}="${serverValue}" (server) vs "${value}" (client)`
        );
      }
    });
  });
  
  if (warnings.length > 0) {
    console.warn('⚠️ Hydration warnings:', warnings);
  }
}

/**
 * Get all Uus directives from element
 */
function getDirectives(element: Element): Array<{ name: string; value: string }> {
  const directives: Array<{ name: string; value: string }> = [];
  
  for (const attr of element.attributes) {
    if (attr.name.startsWith('uus-') || 
        attr.name.startsWith(':') || 
        attr.name.startsWith('@')) {
      directives.push({
        name: attr.name,
        value: attr.value
      });
    }
  }
  
  return directives;
}

/**
 * Create SSR-aware app
 */
export function createSSRApp(options?: any): Uus {
  const app = new Uus(options);
  
  // Override mount to handle hydration
  const originalMount = app.mount.bind(app);
  
  app.mount = function(container?: string | Element) {
    // Check if we're hydrating
    if (typeof window !== 'undefined' && (window as any).__UUS_STATE__) {
      hydrate(app, container);
      return app;
    }
    
    return originalMount(container);
  };
  
  return app;
}