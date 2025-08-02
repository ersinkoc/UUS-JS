import type { UusInstance } from './types';
import { memoryManager } from './memory';

export interface LifecycleHooks {
  created?: () => void;
  mounted?: () => void;
  updated?: () => void;
  destroyed?: () => void;
}

export interface ComponentContext {
  element: HTMLElement;
  hooks: LifecycleHooks;
  cleanups: Set<() => void>;
}

const componentMap = new WeakMap<HTMLElement, ComponentContext>();

export function registerComponent(
  element: HTMLElement,
  hooks: LifecycleHooks
): void {
  const context: ComponentContext = {
    element,
    hooks,
    cleanups: new Set(),
  };

  componentMap.set(element, context);

  // Call created hook
  if (hooks.created) {
    hooks.created();
  }
}

export function mountComponent(element: HTMLElement): void {
  const context = componentMap.get(element);
  if (context?.hooks.mounted) {
    context.hooks.mounted();
  }
}

export function updateComponent(element: HTMLElement): void {
  const context = componentMap.get(element);
  if (context?.hooks.updated) {
    context.hooks.updated();
  }
}

export function destroyComponent(element: HTMLElement): void {
  const context = componentMap.get(element);
  if (!context) return;

  try {
    // Call destroyed hook
    if (context.hooks.destroyed) {
      context.hooks.destroyed();
    }
  } catch (error) {
    console.warn('Error in component destroyed hook:', error);
  }

  // Run all cleanups
  context.cleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch (error) {
      console.warn('Error in component cleanup:', error);
    }
  });
  context.cleanups.clear();

  // Remove from map
  componentMap.delete(element);
}

export function addComponentCleanup(
  element: HTMLElement,
  cleanup: () => void
): void {
  const context = componentMap.get(element);
  if (context) {
    context.cleanups.add(cleanup);
  }
}

/**
 * Enhanced component registration with memory tracking
 */
export function registerComponentWithTracking(
  element: HTMLElement,
  hooks: LifecycleHooks,
  uus?: UusInstance
): () => void {
  registerComponent(element, hooks);
  
  // Track component with memory manager if UUS instance is available
  if (uus && (uus as any).memoryTracker) {
    const resourceId = (uus as any).memoryTracker.track('component', element, () => {
      destroyComponent(element);
    }, {
      tagName: element.tagName,
      id: element.id || undefined,
      className: element.className || undefined
    });
    
    // Return cleanup function
    return () => {
      (uus as any).memoryTracker.untrack(resourceId);
    };
  }
  
  // Return basic cleanup
  return () => destroyComponent(element);
}

/**
 * Cleanup all components and their resources
 */
export function cleanupAllComponents(): void {
  // Get all components (we can't iterate WeakMap directly, but we can track them)
  // This is mainly for emergency cleanup scenarios
  console.log('Cleaning up all registered components');
  
  // Note: WeakMaps will be garbage collected automatically when elements are removed
  // This is just for logging/debugging purposes
}

export function observeDOM(root: HTMLElement, uus: UusInstance): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Handle removed nodes
      mutation.removedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          destroyElement(node, uus);
        }
      });

      // Handle added nodes
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Elements might need to be compiled if they contain directives
          if (hasUusAttributes(node)) {
            try {
              (uus as UusInstance & { compile: (node: Node) => void }).compile(
                node
              );
            } catch (error) {
              console.warn('Error compiling dynamically added element:', error);
            }
          }
        }
      });
    });
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributeFilter: ['uus-*'], // Only observe UUS attribute changes
    attributeOldValue: true
  });

  // Store the observer on the UUS instance for testing and cleanup
  (uus as any).__domObserver = observer;

  return observer;
}

function hasUusAttributes(element: HTMLElement): boolean {
  const prefix = 'uus-';
  
  // Check current element
  for (const attr of element.attributes) {
    if (attr.name.startsWith(prefix)) {
      return true;
    }
  }

  // Check children (but limit depth to prevent performance issues)
  const checkChildren = (el: Element, depth: number = 0): boolean => {
    if (depth > 5) return false; // Limit recursion depth
    
    for (const child of el.children) {
      if (child instanceof HTMLElement) {
        for (const attr of child.attributes) {
          if (attr.name.startsWith(prefix)) {
            return true;
          }
        }
        if (checkChildren(child, depth + 1)) {
          return true;
        }
      }
    }
    return false;
  };

  return checkChildren(element);
}

function destroyElement(element: HTMLElement, uus: UusInstance): void {
  try {
    // Destroy component if registered
    destroyComponent(element);

    // Clean up directives
    const cleanups = uus.cleanups.get(element);
    if (cleanups) {
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error in directive cleanup:', error);
        }
      });
      uus.cleanups.delete(element);
    }

    // Recursively clean up children
    Array.from(element.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        destroyElement(child, uus);
      }
    });
    
    // Clean up any tracked resources for this element
    if ((uus as any).memoryTracker) {
      // Clean up resources associated with this element
      const tracker = (uus as any).memoryTracker;
      // Note: We can't directly access tracked resources by element,
      // but the WeakRef system will handle cleanup automatically
    }
  } catch (error) {
    console.warn('Error destroying element:', error);
  }
}
