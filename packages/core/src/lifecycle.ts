import type { UusInstance } from './types';

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
    cleanups: new Set()
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
  
  // Call destroyed hook
  if (context.hooks.destroyed) {
    context.hooks.destroyed();
  }
  
  // Run all cleanups
  context.cleanups.forEach(cleanup => cleanup());
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

export function observeDOM(root: HTMLElement, uus: UusInstance): void {
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
            (uus as any).compile(node);
          }
        }
      });
    });
  });
  
  observer.observe(root, {
    childList: true,
    subtree: true
  });
  
  // Store observer for cleanup
  (uus as any).__domObserver = observer;
}

function hasUusAttributes(element: HTMLElement): boolean {
  const prefix = 'uus-';
  for (const attr of element.attributes) {
    if (attr.name.startsWith(prefix)) {
      return true;
    }
  }
  
  // Check children
  for (const child of element.children) {
    if (child instanceof HTMLElement && hasUusAttributes(child)) {
      return true;
    }
  }
  
  return false;
}

function destroyElement(element: HTMLElement, uus: UusInstance): void {
  // Destroy component if registered
  destroyComponent(element);
  
  // Clean up directives
  const cleanups = uus.cleanups.get(element);
  if (cleanups) {
    cleanups.forEach(cleanup => cleanup());
    uus.cleanups.delete(element);
  }
  
  // Recursively clean up children
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      destroyElement(child, uus);
    }
  });
}