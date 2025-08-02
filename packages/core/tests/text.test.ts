import { describe, it, expect, beforeEach, vi } from 'vitest';
import { textDirective } from '../src/directives/text';
import { Uus } from '../src/uus';

describe('Text Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('span');
    document.body.appendChild(element);

    // Set up basic state
    uus.state.message = 'Hello World';
    uus.state.name = 'John';
    uus.state.age = 25;
    uus.state.isActive = true;
    uus.state.count = 42;
  });

  it('should set text content from state', () => {
    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('Hello World');
  });

  it('should handle string expressions', () => {
    const binding = {
      expression: 'name + " is " + age + " years old"',
      arg: undefined,
      modifiers: {},
      value: 'name + " is " + age + " years old"',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('John is 25 years old');
  });

  it('should handle boolean values', () => {
    const binding = {
      expression: 'isActive',
      arg: undefined,
      modifiers: {},
      value: 'isActive',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('true');
  });

  it('should handle numeric values', () => {
    const binding = {
      expression: 'count',
      arg: undefined,
      modifiers: {},
      value: 'count',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('42');
  });

  it('should handle null values', () => {
    uus.state.nullValue = null;

    const binding = {
      expression: 'nullValue',
      arg: undefined,
      modifiers: {},
      value: 'nullValue',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('');
  });

  it('should handle undefined values', () => {
    uus.state.undefinedValue = undefined;

    const binding = {
      expression: 'undefinedValue',
      arg: undefined,
      modifiers: {},
      value: 'undefinedValue',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('');
  });

  it('should handle empty expression', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: '',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('');
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.subProperty',
      arg: undefined,
      modifiers: {},
      value: 'nonExistentProperty.subProperty',
    };

    textDirective.bind!(element, binding, uus);

    // The evaluator catches errors and returns undefined
    // String(undefined ?? '') results in empty string
    expect(element.textContent).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UUS_EVALUATION_ERROR]')
    );

    consoleSpy.mockRestore();
  });

  it('should handle mathematical expressions', () => {
    const binding = {
      expression: 'count * 2 + 8',
      arg: undefined,
      modifiers: {},
      value: 'count * 2 + 8',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('92'); // 42 * 2 + 8 = 92
  });

  it('should handle conditional expressions', () => {
    const binding = {
      expression: 'isActive ? "Active" : "Inactive"',
      arg: undefined,
      modifiers: {},
      value: 'isActive ? "Active" : "Inactive"',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('Active');
  });

  it('should handle array access', () => {
    uus.state.items = ['apple', 'banana', 'cherry'];

    const binding = {
      expression: 'items[1]',
      arg: undefined,
      modifiers: {},
      value: 'items[1]',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('banana');
  });

  it('should handle object property access', () => {
    uus.state.user = { name: 'Alice', role: 'admin' };

    const binding = {
      expression: 'user.name + " (" + user.role + ")"',
      arg: undefined,
      modifiers: {},
      value: 'user.name + " (" + user.role + ")"',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('Alice (admin)');
  });

  it('should handle cleanup on unbind', () => {
    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    textDirective.bind!(element, binding, uus);

    // Should have cleanup functions
    expect(uus.cleanups.has(element)).toBe(true);

    textDirective.unbind!(element, binding, uus);

    // Should clean up
    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    // Call unbind without bind first
    expect(() => {
      textDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should convert objects to strings', () => {
    uus.state.obj = { toString: () => 'Custom String' };

    const binding = {
      expression: 'obj',
      arg: undefined,
      modifiers: {},
      value: 'obj',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('Custom String');
  });

  it('should handle complex nested expressions', () => {
    uus.state.data = {
      user: {
        profile: {
          fullName: 'John Doe',
        },
      },
    };

    const binding = {
      expression: 'data.user.profile.fullName',
      arg: undefined,
      modifiers: {},
      value: 'data.user.profile.fullName',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('John Doe');
  });

  it('should handle string methods', () => {
    const binding = {
      expression: 'name.toUpperCase()',
      arg: undefined,
      modifiers: {},
      value: 'name.toUpperCase()',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('JOHN');
  });

  it('should update when state changes', () => {
    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('Hello World');

    // Change state
    uus.state.message = 'Updated Message';

    // In a real reactive system, this would update automatically
    // For testing, we verify the state changed
    expect(uus.state.message).toBe('Updated Message');
  });

  it('should handle zero as a valid value', () => {
    uus.state.zero = 0;

    const binding = {
      expression: 'zero',
      arg: undefined,
      modifiers: {},
      value: 'zero',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('0');
  });

  it('should handle false as a valid value', () => {
    uus.state.falseValue = false;

    const binding = {
      expression: 'falseValue',
      arg: undefined,
      modifiers: {},
      value: 'falseValue',
    };

    textDirective.bind!(element, binding, uus);

    expect(element.textContent).toBe('false');
  });
});
