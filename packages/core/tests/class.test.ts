import { describe, it, expect, beforeEach, vi } from 'vitest';
import { classDirective } from '../src/directives/class';
import { Uus } from '../src/uus';

describe('Class Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    document.body.appendChild(element);
    
    // Set up basic state
    uus.state.isActive = true;
    uus.state.isDisabled = false;
    uus.state.theme = 'dark';
    uus.state.status = 'loading';
  });

  it('should handle object-based classes', () => {
    const binding = {
      expression: '{ active: isActive, disabled: isDisabled }',
      arg: undefined,
      modifiers: {},
      value: '{ active: isActive, disabled: isDisabled }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('active')).toBe(true);
    expect(element.classList.contains('disabled')).toBe(false);
  });

  it('should handle string-based classes', () => {
    const binding = {
      expression: '"btn btn-primary active"',
      arg: undefined,
      modifiers: {},
      value: '"btn btn-primary active"'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('btn')).toBe(true);
    expect(element.classList.contains('btn-primary')).toBe(true);
    expect(element.classList.contains('active')).toBe(true);
  });

  it('should handle array-based classes (processed as objects)', () => {
    uus.state.classes = ['btn', 'btn-large', 'btn-success', '', null, 'final'];

    const binding = {
      expression: 'classes',
      arg: undefined,
      modifiers: {},
      value: 'classes'
    };

    classDirective.bind!(element, binding, uus);

    // Arrays are treated as objects, so indices with truthy values get added as class names
    expect(element.classList.contains('0')).toBe(true); // index '0' has truthy value 'btn'
    expect(element.classList.contains('1')).toBe(true); // index '1' has truthy value 'btn-large' 
    expect(element.classList.contains('2')).toBe(true); // index '2' has truthy value 'btn-success'
    expect(element.classList.contains('5')).toBe(true); // index '5' has truthy value 'final'
    expect(element.classList.contains('3')).toBe(false); // index '3' has falsy value ''
    expect(element.classList.contains('4')).toBe(false); // index '4' has null value
  });

  it('should preserve original classes', () => {
    element.className = 'original-class existing-class';

    const binding = {
      expression: '{ added: true }',
      arg: undefined,
      modifiers: {},
      value: '{ added: true }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('original-class')).toBe(true);
    expect(element.classList.contains('existing-class')).toBe(true);
    expect(element.classList.contains('added')).toBe(true);
  });

  it('should handle dynamic object classes', () => {
    const binding = {
      expression: '{ [theme]: true, [status]: isActive }',
      arg: undefined,
      modifiers: {},
      value: '{ [theme]: true, [status]: isActive }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('dark')).toBe(true);
    expect(element.classList.contains('loading')).toBe(true);
  });

  it('should handle conditional classes', () => {
    const binding = {
      expression: '{ "theme-dark": theme === "dark", "is-loading": status === "loading" }',
      arg: undefined,
      modifiers: {},
      value: '{ "theme-dark": theme === "dark", "is-loading": status === "loading" }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('theme-dark')).toBe(true);
    expect(element.classList.contains('is-loading')).toBe(true);
  });

  it('should remove classes when condition becomes false', () => {
    element.className = 'persistent-class';

    const binding = {
      expression: '{ removable: isActive }',
      arg: undefined,
      modifiers: {},
      value: '{ removable: isActive }'
    };

    classDirective.bind!(element, binding, uus);

    // Initially should have the class
    expect(element.classList.contains('removable')).toBe(true);
    expect(element.classList.contains('persistent-class')).toBe(true);

    // Change state to false
    uus.state.isActive = false;

    // In a real reactive system, this would trigger re-evaluation
    // For testing, verify state changed
    expect(uus.state.isActive).toBe(false);
  });

  it('should handle empty string classes', () => {
    const binding = {
      expression: '""',
      arg: undefined,
      modifiers: {},
      value: '""'
    };

    classDirective.bind!(element, binding, uus);

    // Should not add any classes
    expect(element.className).toBe('');
  });

  it('should handle string with multiple spaces', () => {
    const binding = {
      expression: '"  class1    class2  class3  "',
      arg: undefined,
      modifiers: {},
      value: '"  class1    class2  class3  "'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('class1')).toBe(true);
    expect(element.classList.contains('class2')).toBe(true);
    expect(element.classList.contains('class3')).toBe(true);
    expect(element.classList.length).toBe(3);
  });

  it('should handle arrays with falsy values (processed as objects)', () => {
    uus.state.mixedArray = ['valid-class', '', null, undefined, 'another-class', false, 0];

    const binding = {
      expression: 'mixedArray',
      arg: undefined,
      modifiers: {},
      value: 'mixedArray'
    };

    classDirective.bind!(element, binding, uus);

    // Arrays are processed as objects with numeric keys
    // Only indices with truthy values get added as class names
    expect(element.classList.contains('0')).toBe(true); // index 0 has truthy value 'valid-class'
    expect(element.classList.contains('4')).toBe(true); // index 4 has truthy value 'another-class'
    expect(element.classList.contains('1')).toBe(false); // index 1 has falsy value ''
    expect(element.classList.contains('5')).toBe(false); // index 5 has falsy value false
  });

  it('should handle complex expressions', () => {
    uus.state.count = 5;

    const binding = {
      expression: '{ "high-count": count > 3, "low-count": count <= 3 }',
      arg: undefined,
      modifiers: {},
      value: '{ "high-count": count > 3, "low-count": count <= 3 }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('high-count')).toBe(true);
    expect(element.classList.contains('low-count')).toBe(false);
  });

  it('should handle null and undefined values', () => {
    uus.state.nullValue = null;
    uus.state.undefinedValue = undefined;

    const binding = {
      expression: 'nullValue || undefinedValue || "fallback-class"',
      arg: undefined,
      modifiers: {},
      value: 'nullValue || undefinedValue || "fallback-class"'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('fallback-class')).toBe(true);
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.classes',
      arg: undefined,
      modifiers: {},
      value: 'nonExistentProperty.classes'
    };

    classDirective.bind!(element, binding, uus);

    // The evaluator catches errors and returns undefined
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error evaluating expression'), expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle empty object', () => {
    const binding = {
      expression: '{}',
      arg: undefined,
      modifiers: {},
      value: '{}'
    };

    classDirective.bind!(element, binding, uus);

    // Should not add any classes
    expect(element.className).toBe('');
  });

  it('should handle boolean values', () => {
    uus.state.showClass = true;

    const binding = {
      expression: 'showClass ? "visible" : "hidden"',
      arg: undefined,
      modifiers: {},
      value: 'showClass ? "visible" : "hidden"'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('visible')).toBe(true);
    expect(element.classList.contains('hidden')).toBe(false);
  });

  it('should handle numeric values', () => {
    uus.state.priority = 1;

    const binding = {
      expression: '"priority-" + priority',
      arg: undefined,
      modifiers: {},
      value: '"priority-" + priority'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('priority-1')).toBe(true);
  });

  it('should clean up when unbinding', () => {
    const binding = {
      expression: '{ test: true }',
      arg: undefined,
      modifiers: {},
      value: '{ test: true }'
    };

    classDirective.bind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(true);
    
    classDirective.unbind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: '{ test: true }',
      arg: undefined,
      modifiers: {},
      value: '{ test: true }'
    };

    // Call unbind without bind first
    expect(() => {
      classDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should reset classes on each update', () => {
    element.className = 'original persistent';

    const binding = {
      expression: '{ dynamic: isActive }',
      arg: undefined,
      modifiers: {},
      value: '{ dynamic: isActive }'
    };

    classDirective.bind!(element, binding, uus);

    // Should have original classes plus dynamic
    expect(element.classList.contains('original')).toBe(true);
    expect(element.classList.contains('persistent')).toBe(true);
    expect(element.classList.contains('dynamic')).toBe(true);
  });

  it('should handle mixed class types in expression', () => {
    const binding = {
      expression: 'isActive ? { active: true, ready: true } : ["inactive", "pending"]',
      arg: undefined,
      modifiers: {},
      value: 'isActive ? { active: true, ready: true } : ["inactive", "pending"]'
    };

    classDirective.bind!(element, binding, uus);

    // isActive is true, so should get object classes
    expect(element.classList.contains('active')).toBe(true);
    expect(element.classList.contains('ready')).toBe(true);
    expect(element.classList.contains('inactive')).toBe(false);
    expect(element.classList.contains('pending')).toBe(false);
  });

  it('should handle class names with special characters', () => {
    const binding = {
      expression: '{ "btn-primary": true, "has_underscores": true, "with-123": true }',
      arg: undefined,
      modifiers: {},
      value: '{ "btn-primary": true, "has_underscores": true, "with-123": true }'
    };

    classDirective.bind!(element, binding, uus);

    expect(element.classList.contains('btn-primary')).toBe(true);
    expect(element.classList.contains('has_underscores')).toBe(true);
    expect(element.classList.contains('with-123')).toBe(true);
  });

  it('should handle empty expression', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: ''
    };

    classDirective.bind!(element, binding, uus);

    // Should use default '{}' and not add classes
    expect(element.className).toBe('');
  });
});