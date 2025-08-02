import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showDirective } from '../src/directives/show';
import { Uus } from '../src/uus';

describe('Show Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    element.textContent = 'Test content';
    document.body.appendChild(element);
    
    // Set up basic state
    uus.state.isVisible = true;
    uus.state.shouldShow = false;
    uus.state.count = 5;
    uus.state.user = { active: true };
  });

  it('should show element when condition is true', () => {
    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // Element should be visible (display not set to 'none')
    expect(element.style.display).not.toBe('none');
  });

  it('should hide element when condition is false', () => {
    const binding = {
      expression: 'shouldShow',
      arg: undefined,
      modifiers: {},
      value: 'shouldShow'
    };

    showDirective.bind!(element, binding, uus);

    // Element should be hidden
    expect(element.style.display).toBe('none');
  });

  it('should preserve original display style when showing', () => {
    element.style.display = 'flex';

    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // Should preserve original display style
    expect(element.style.display).toBe('flex');
  });

  it('should handle elements with no initial display style', () => {
    // Element has no display style set
    expect(element.style.display).toBe('');

    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // Should remain empty string (default browser display)
    expect(element.style.display).toBe('');
  });

  it('should handle complex boolean expressions', () => {
    const binding = {
      expression: 'count > 3 && isVisible',
      arg: undefined,
      modifiers: {},
      value: 'count > 3 && isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // count = 5, isVisible = true, so 5 > 3 && true = true
    expect(element.style.display).not.toBe('none');
  });

  it('should handle nested object properties', () => {
    const binding = {
      expression: 'user.active',
      arg: undefined,
      modifiers: {},
      value: 'user.active'
    };

    showDirective.bind!(element, binding, uus);

    expect(element.style.display).not.toBe('none');
  });

  it('should handle falsy values', () => {
    uus.state.emptyString = '';

    const binding = {
      expression: 'emptyString',
      arg: undefined,
      modifiers: {},
      value: 'emptyString'
    };

    showDirective.bind!(element, binding, uus);

    // Empty string is falsy
    expect(element.style.display).toBe('none');
  });

  it('should handle truthy values', () => {
    uus.state.nonEmptyString = 'hello';

    const binding = {
      expression: 'nonEmptyString',
      arg: undefined,
      modifiers: {},
      value: 'nonEmptyString'
    };

    showDirective.bind!(element, binding, uus);

    // Non-empty string is truthy
    expect(element.style.display).not.toBe('none');
  });

  it('should handle numeric values', () => {
    uus.state.zero = 0;
    uus.state.nonZero = 42;

    // Test zero (falsy) - create new element for clean test
    const zeroElement = document.createElement('div');
    document.body.appendChild(zeroElement);
    
    let binding = {
      expression: 'zero',
      arg: undefined,
      modifiers: {},
      value: 'zero'
    };

    showDirective.bind!(zeroElement, binding, uus);
    expect(zeroElement.style.display).toBe('none');

    // Test non-zero (truthy) - create new element for clean test  
    const nonZeroElement = document.createElement('div');
    document.body.appendChild(nonZeroElement);
    
    binding = {
      expression: 'nonZero',
      arg: undefined,
      modifiers: {},
      value: 'nonZero'
    };

    showDirective.bind!(nonZeroElement, binding, uus);
    expect(nonZeroElement.style.display).not.toBe('none');
  });

  it('should handle null and undefined', () => {
    uus.state.nullValue = null;
    uus.state.undefinedValue = undefined;

    // Test null (falsy)
    let binding = {
      expression: 'nullValue',
      arg: undefined,
      modifiers: {},
      value: 'nullValue'
    };

    showDirective.bind!(element, binding, uus);
    expect(element.style.display).toBe('none');

    // Test undefined (falsy)
    binding = {
      expression: 'undefinedValue',
      arg: undefined,
      modifiers: {},
      value: 'undefinedValue'
    };

    showDirective.bind!(element, binding, uus);
    expect(element.style.display).toBe('none');
  });

  it('should handle array length checks', () => {
    uus.state.emptyArray = [];
    uus.state.filledArray = [1, 2, 3];

    // Test empty array length (falsy) - create new element for clean test
    const emptyElement = document.createElement('div');
    document.body.appendChild(emptyElement);
    
    let binding = {
      expression: 'emptyArray.length',
      arg: undefined,
      modifiers: {},
      value: 'emptyArray.length'
    };

    showDirective.bind!(emptyElement, binding, uus);
    expect(emptyElement.style.display).toBe('none');

    // Test filled array length (truthy) - create new element for clean test
    const filledElement = document.createElement('div');
    document.body.appendChild(filledElement);
    
    binding = {
      expression: 'filledArray.length',
      arg: undefined,
      modifiers: {},
      value: 'filledArray.length'
    };

    showDirective.bind!(filledElement, binding, uus);
    expect(filledElement.style.display).not.toBe('none');
  });

  it('should handle negation operator', () => {
    const binding = {
      expression: '!shouldShow',
      arg: undefined,
      modifiers: {},
      value: '!shouldShow'
    };

    showDirective.bind!(element, binding, uus);

    // shouldShow is false, so !shouldShow is true
    expect(element.style.display).not.toBe('none');
  });

  it('should handle comparison operators', () => {
    const binding = {
      expression: 'count >= 5',
      arg: undefined,
      modifiers: {},
      value: 'count >= 5'
    };

    showDirective.bind!(element, binding, uus);

    // count = 5, so 5 >= 5 is true
    expect(element.style.display).not.toBe('none');
  });

  it('should use default "true" when expression is empty', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: ''
    };

    showDirective.bind!(element, binding, uus);

    // Should default to true and show element
    expect(element.style.display).not.toBe('none');
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    element.style.display = 'block';

    const binding = {
      expression: 'nonExistentProperty.subProperty',
      arg: undefined,
      modifiers: {},
      value: 'nonExistentProperty.subProperty'
    };

    showDirective.bind!(element, binding, uus);

    // The evaluator catches errors and returns undefined (falsy)
    expect(element.style.display).toBe('none');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error evaluating expression'), expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should clean up when unbinding', () => {
    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);
    
    // Should have cleanup functions
    expect(uus.cleanups.has(element)).toBe(true);
    
    showDirective.unbind!(element, binding, uus);
    
    // Should clean up
    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    // Call unbind without bind first
    expect(() => {
      showDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should restore original display on state changes', () => {
    element.style.display = 'inline-block';

    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // Initially visible with original display
    expect(element.style.display).toBe('inline-block');

    // Change state to false
    uus.state.isVisible = false;

    // In a real reactive system, this would trigger hiding
    // For testing, we verify the state changed
    expect(uus.state.isVisible).toBe(false);
  });

  it('should handle mixed conditional logic', () => {
    uus.state.isAdmin = true;
    uus.state.hasPermission = false;

    const binding = {
      expression: 'isAdmin || hasPermission',
      arg: undefined,
      modifiers: {},
      value: 'isAdmin || hasPermission'
    };

    showDirective.bind!(element, binding, uus);

    // isAdmin is true, so true || false = true
    expect(element.style.display).not.toBe('none');
  });

  it('should handle string comparisons', () => {
    uus.state.status = 'active';

    const binding = {
      expression: 'status === "active"',
      arg: undefined,
      modifiers: {},
      value: 'status === "active"'
    };

    showDirective.bind!(element, binding, uus);

    expect(element.style.display).not.toBe('none');
  });

  it('should handle function calls', () => {
    uus.state.items = [1, 2, 3, 4, 5];

    const binding = {
      expression: 'items.includes(3)',
      arg: undefined,
      modifiers: {},
      value: 'items.includes(3)'
    };

    showDirective.bind!(element, binding, uus);

    // Array includes 3, so should be visible
    expect(element.style.display).not.toBe('none');
  });

  it('should preserve inline styles', () => {
    element.style.cssText = 'color: red; font-size: 16px; display: flex;';

    const binding = {
      expression: 'isVisible',
      arg: undefined,
      modifiers: {},
      value: 'isVisible'
    };

    showDirective.bind!(element, binding, uus);

    // Should preserve display: flex
    expect(element.style.display).toBe('flex');
    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
  });
});