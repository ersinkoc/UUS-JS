/**
 * UUS.js Test Utilities
 * Testing helpers for UUS.js applications
 */

import type { Uus, ReactiveState } from '@uusjs/core';

export interface RenderResult {
  container: HTMLElement;
  element: HTMLElement;
  uus: Uus;
  unmount: () => void;
  rerender: (newTemplate?: string) => void;
  debug: () => void;
  getByText: (text: string) => HTMLElement | null;
  getByTestId: (id: string) => HTMLElement | null;
  queryByText: (text: string) => HTMLElement | null;
  queryByTestId: (id: string) => HTMLElement | null;
  getAllByText: (text: string) => HTMLElement[];
  findByText: (text: string, timeout?: number) => Promise<HTMLElement>;
  findByTestId: (id: string, timeout?: number) => Promise<HTMLElement>;
}

export interface RenderOptions {
  container?: HTMLElement;
  state?: ReactiveState;
  template?: string;
}

/**
 * Render a UUS.js component for testing
 */
export function render(
  template: string,
  options: RenderOptions = {}
): RenderResult {
  // Create container
  const container = options.container || document.createElement('div');
  document.body.appendChild(container);
  
  // Set template
  container.innerHTML = template;
  
  // Create UUS instance
  const uus = new (window as any).Uus({
    debug: false // Disable debug logs in tests
  });
  
  // Mount
  const element = container.firstElementChild as HTMLElement;
  uus.mount(element);
  
  // Helper functions
  const getByText = (text: string): HTMLElement | null => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.includes(text)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const node = walker.nextNode();
    return node?.parentElement as HTMLElement || null;
  };
  
  const getByTestId = (id: string): HTMLElement | null => {
    return container.querySelector(`[data-testid="${id}"]`);
  };
  
  const queryByText = getByText;
  const queryByTestId = getByTestId;
  
  const getAllByText = (text: string): HTMLElement[] => {
    const elements: HTMLElement[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent?.includes(text)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement) {
        elements.push(node.parentElement as HTMLElement);
      }
    }
    
    return elements;
  };
  
  const findByText = async (text: string, timeout = 1000): Promise<HTMLElement> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = getByText(text);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Unable to find element with text: ${text}`);
  };
  
  const findByTestId = async (id: string, timeout = 1000): Promise<HTMLElement> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = getByTestId(id);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Unable to find element with data-testid: ${id}`);
  };
  
  const unmount = () => {
    uus.unmount();
    container.remove();
  };
  
  const rerender = (newTemplate?: string) => {
    if (newTemplate) {
      container.innerHTML = newTemplate;
      const newElement = container.firstElementChild as HTMLElement;
      uus.unmount();
      uus.mount(newElement);
    } else {
      // Force re-render by triggering state change
      if (uus.state) {
        uus.state.__forceUpdate = !uus.state.__forceUpdate;
      }
    }
  };
  
  const debug = () => {
    console.log(container.innerHTML);
  };
  
  return {
    container,
    element,
    uus,
    unmount,
    rerender,
    debug,
    getByText,
    getByTestId,
    queryByText,
    queryByTestId,
    getAllByText,
    findByText,
    findByTestId
  };
}

/**
 * Fire an event on an element
 */
export function fireEvent(
  element: HTMLElement,
  event: string,
  detail?: any
): void {
  const customEvent = new CustomEvent(event, {
    bubbles: true,
    cancelable: true,
    detail
  });
  
  element.dispatchEvent(customEvent);
}

// Specific event helpers
fireEvent.click = (element: HTMLElement) => {
  element.click();
};

fireEvent.change = (element: HTMLInputElement, value: string) => {
  element.value = value;
  fireEvent(element, 'input');
  fireEvent(element, 'change');
};

fireEvent.input = (element: HTMLInputElement, value: string) => {
  element.value = value;
  fireEvent(element, 'input');
};

fireEvent.submit = (element: HTMLFormElement) => {
  fireEvent(element, 'submit');
};

fireEvent.keyDown = (element: HTMLElement, key: string) => {
  const event = new KeyboardEvent('keydown', { key });
  element.dispatchEvent(event);
};

fireEvent.keyUp = (element: HTMLElement, key: string) => {
  const event = new KeyboardEvent('keyup', { key });
  element.dispatchEvent(event);
};

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  callback: () => boolean | void,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const result = callback();
      if (result !== false) return;
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timed out waiting for condition');
}

/**
 * Wait for an element to appear
 */
export async function waitForElement(
  selector: string,
  container: HTMLElement = document.body,
  timeout = 1000
): Promise<HTMLElement> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) return element;
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(`Element not found: ${selector}`);
}

/**
 * Wait for an element to be removed
 */
export async function waitForElementToBeRemoved(
  element: HTMLElement | (() => HTMLElement | null),
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const el = typeof element === 'function' ? element() : element;
    if (!el || !document.body.contains(el)) return;
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error('Element was not removed');
}

/**
 * Create a mock function for testing
 */
export function createMockFunction<T extends (...args: any[]) => any>(): T & {
  calls: Parameters<T>[];
  mockImplementation: (fn: T) => void;
  mockReturnValue: (value: ReturnType<T>) => void;
  mockClear: () => void;
} {
  let implementation: T | undefined;
  let returnValue: ReturnType<T> | undefined;
  const calls: Parameters<T>[] = [];
  
  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args);
    
    if (implementation) {
      return implementation(...args);
    }
    
    return returnValue;
  }) as T;
  
  return Object.assign(mockFn, {
    calls,
    mockImplementation: (fn: T) => {
      implementation = fn;
    },
    mockReturnValue: (value: ReturnType<T>) => {
      returnValue = value;
    },
    mockClear: () => {
      calls.length = 0;
      implementation = undefined;
      returnValue = undefined;
    }
  });
}

/**
 * Clean up after all tests
 */
export function cleanup(): void {
  // Remove all elements added to body during tests
  document.body.innerHTML = '';
  
  // Clear any timers
  const highestId = setTimeout(() => {}, 0);
  for (let i = 0; i < highestId; i++) {
    clearTimeout(i);
    clearInterval(i);
  }
  
  // Clear any RAF
  if (typeof cancelAnimationFrame !== 'undefined') {
    const highestRAF = requestAnimationFrame(() => {});
    for (let i = 0; i < highestRAF; i++) {
      cancelAnimationFrame(i);
    }
  }
}

/**
 * Setup automatic cleanup after each test
 */
export function setupAutoCleanup(): void {
  if (typeof afterEach !== 'undefined') {
    afterEach(cleanup);
  }
}

/**
 * Create a test harness for UUS.js components
 */
export class TestHarness {
  private cleanups: (() => void)[] = [];
  
  render(template: string, options?: RenderOptions): RenderResult {
    const result = render(template, options);
    this.cleanups.push(() => result.unmount());
    return result;
  }
  
  cleanup(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    cleanup();
  }
  
  async act(callback: () => void | Promise<void>): Promise<void> {
    await callback();
    // Allow microtasks to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Export convenience instance
export const testHarness = new TestHarness();

// Re-export common matchers for convenience
export { expect } from 'vitest';

export default {
  render,
  fireEvent,
  waitFor,
  waitForElement,
  waitForElementToBeRemoved,
  createMockFunction,
  cleanup,
  setupAutoCleanup,
  TestHarness,
  testHarness
};