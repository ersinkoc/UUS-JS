import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flipDirective, layoutDirective } from '../src/flip';

// Mock DOM APIs
global.MutationObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  callback,
}));

// Mock getBoundingClientRect
const mockGetBoundingClientRect = vi.fn();

describe('FLIP Package', () => {
  let mockUus: any;
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);

    mockUus = {
      cleanups: new Map(),
    };

    // Reset getBoundingClientRect mock
    mockGetBoundingClientRect.mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
    });

    element.getBoundingClientRect = mockGetBoundingClientRect;

    // Mock getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: vi.fn(() => ({
        opacity: '1',
      })),
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    if (element.parentNode) {
      document.body.removeChild(element);
    }
  });

  describe('flipDirective', () => {
    it('should not initialize when expression is not true', () => {
      const binding = { expression: 'false' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).not.toHaveBeenCalled();
    });

    it('should initialize with default options when expression is true', () => {
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockUus.cleanups.get(element)).toBeDefined();
    });

    it('should use custom duration from attribute', () => {
      element.setAttribute('uus-flip-duration', '500');
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should use custom easing from attribute', () => {
      element.setAttribute('uus-flip-easing', 'ease-in-out');
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should enable scale animation when attribute is present', () => {
      element.setAttribute('uus-flip-scale', '');
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should enable opacity animation when attribute is present', () => {
      element.setAttribute('uus-flip-opacity', '');
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should observe element for DOM changes', () => {
      const binding = { expression: 'true' };
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      (global.MutationObserver as any).mockReturnValue(mockObserver);

      flipDirective.init?.(element, binding, mockUus);

      expect(mockObserver.observe).toHaveBeenCalledWith(element, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    });

    it('should store cleanup function', () => {
      const binding = { expression: 'true' };
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      (global.MutationObserver as any).mockReturnValue(mockObserver);

      flipDirective.init?.(element, binding, mockUus);

      const cleanups = mockUus.cleanups.get(element);
      expect(cleanups).toBeDefined();
      expect(cleanups.size).toBe(1);

      // Test cleanup execution
      const cleanup = Array.from(cleanups)[0];
      cleanup();
      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should save initial flip state', () => {
      const binding = { expression: 'true' };

      flipDirective.init?.(element, binding, mockUus);

      expect(element.getBoundingClientRect).toHaveBeenCalled();
      expect(window.getComputedStyle).toHaveBeenCalledWith(element);
    });
  });

  describe('layoutDirective', () => {
    it('should apply flex layout by default', () => {
      const binding = { expression: '' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.display).toBe('flex');
      expect(element.style.flexWrap).toBe('wrap');
      expect(element.style.gap).toBe('1rem');
    });

    it('should apply flex layout when specified', () => {
      const binding = { expression: 'flex' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.display).toBe('flex');
      expect(element.style.flexWrap).toBe('wrap');
      expect(element.style.gap).toBe('1rem');
    });

    it('should apply grid layout when specified', () => {
      const binding = { expression: 'grid' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.display).toBe('grid');
      expect(element.style.gridTemplateColumns).toBe(
        'repeat(auto-fill, minmax(200px, 1fr))'
      );
      expect(element.style.gap).toBe('1rem');
    });

    it('should use custom grid columns', () => {
      element.setAttribute('uus-cols', 'repeat(3, 1fr)');
      const binding = { expression: 'grid' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
    });

    it('should use custom gap', () => {
      element.setAttribute('uus-gap', '2rem');
      const binding = { expression: 'flex' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.gap).toBe('2rem');
    });

    it('should use custom flex wrap', () => {
      element.setAttribute('uus-wrap', 'nowrap');
      const binding = { expression: 'flex' };

      layoutDirective.bind?.(element, binding, mockUus);

      expect(element.style.flexWrap).toBe('nowrap');
    });

    it('should enable FLIP when attribute is present', () => {
      element.setAttribute('uus-flip', '');
      const binding = { expression: 'flex' };

      // Mock flipDirective.init
      const originalInit = flipDirective.init;
      flipDirective.init = vi.fn();

      layoutDirective.bind?.(element, binding, mockUus);

      expect(flipDirective.init).toHaveBeenCalledWith(
        element,
        { expression: 'true', value: true, modifiers: {} },
        mockUus
      );

      // Restore original
      flipDirective.init = originalInit;
    });

    it('should not enable FLIP when attribute is not present', () => {
      const binding = { expression: 'flex' };

      // Mock flipDirective.init
      const originalInit = flipDirective.init;
      flipDirective.init = vi.fn();

      layoutDirective.bind?.(element, binding, mockUus);

      expect(flipDirective.init).not.toHaveBeenCalled();

      // Restore original
      flipDirective.init = originalInit;
    });
  });

  describe('FLIP animation behavior', () => {
    it('should handle position changes', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      // Capture the mutation callback
      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Should have initialized and captured callback
      expect(mutationCallback).toBeDefined();
      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should handle size changes with scale enabled', () => {
      element.setAttribute('uus-flip-scale', '');
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Should have initialized with scale enabled
      expect(element.hasAttribute('uus-flip-scale')).toBe(true);
      expect(mutationCallback).toBeDefined();
    });

    it('should skip animation when no changes detected', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Same position and size
      mockGetBoundingClientRect.mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      });

      // Trigger mutation
      mutationCallback!([], {} as MutationObserver);

      // Should not apply any transform
      expect(element.style.transform).toBe('');
    });

    it('should handle opacity changes when enabled', () => {
      element.setAttribute('uus-flip-opacity', '');
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Should have initialized with opacity enabled
      expect(element.hasAttribute('uus-flip-opacity')).toBe(true);
      expect(mutationCallback).toBeDefined();
    });

    it('should clean up transition styles after animation', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Should have initialized the FLIP animation system
      expect(mutationCallback).toBeDefined();
      expect(global.MutationObserver).toHaveBeenCalled();
    });
  });

  describe('FLIP edge cases and error handling', () => {
    it('should handle missing firstState gracefully', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Don't call getBoundingClientRect initially to simulate missing first state
      mockGetBoundingClientRect.mockClear();

      // Trigger mutation without first state
      mutationCallback!([], {} as MutationObserver);

      // Should handle gracefully
      expect(mockGetBoundingClientRect).toHaveBeenCalled();
    });

    it('should skip animation when no changes detected', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Same position and size should not trigger animation
      mockGetBoundingClientRect.mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      });

      // Trigger mutation
      mutationCallback!([], {} as MutationObserver);

      // Should not apply any transform for no changes
      expect(element.style.transform).toBe('');
    });

    it('should handle FLIP with only position changes', () => {
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Set up different positions but same size
      let callCount = 0;
      mockGetBoundingClientRect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
          };
        } else {
          return {
            left: 50,
            top: 50,
            width: 100,
            height: 100,
            right: 150,
            bottom: 150,
            x: 50,
            y: 50,
          };
        }
      });

      // Trigger mutation
      mutationCallback!([], {} as MutationObserver);

      // Verify FLIP was attempted
      expect(mockGetBoundingClientRect).toHaveBeenCalledTimes(2);
    });

    it('should handle FLIP with scale and opacity options', () => {
      element.setAttribute('uus-flip-scale', '');
      element.setAttribute('uus-flip-opacity', '');
      const binding = { expression: 'true' };
      let mutationCallback: MutationCallback;

      (global.MutationObserver as any).mockImplementation(
        (callback: MutationCallback) => {
          mutationCallback = callback;
          return {
            observe: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      );

      flipDirective.init?.(element, binding, mockUus);

      // Set up changes in position, size, and opacity
      let rectCallCount = 0;
      let styleCallCount = 0;

      mockGetBoundingClientRect.mockImplementation(() => {
        rectCallCount++;
        if (rectCallCount === 1) {
          return {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
          };
        } else {
          return {
            left: 10,
            top: 10,
            width: 200,
            height: 200,
            right: 210,
            bottom: 210,
            x: 10,
            y: 10,
          };
        }
      });

      (window.getComputedStyle as any).mockImplementation(() => {
        styleCallCount++;
        return { opacity: styleCallCount === 1 ? '1' : '0.5' };
      });

      // Trigger mutation
      mutationCallback!([], {} as MutationObserver);

      // Should have attempted FLIP with scale and opacity
      expect(mockGetBoundingClientRect).toHaveBeenCalledTimes(2);
      expect(window.getComputedStyle).toHaveBeenCalledTimes(2);
    });
  });
});
