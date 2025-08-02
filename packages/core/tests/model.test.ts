import { describe, it, expect, beforeEach, vi } from 'vitest';
import { modelDirective } from '../src/directives/model';
import { Uus } from '../src/uus';

describe('Model Directive', () => {
  let uus: Uus;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();

    // Set up basic state for two-way binding
    uus.state.message = 'Hello World';
    uus.state.isChecked = true;
    uus.state.selectedOption = 'option2';
    uus.state.numberValue = 42;
    uus.state.user = { name: 'John' };
  });

  it('should bind text input to state', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(input, binding, uus);

    // Initial value should be set from state
    expect(input.value).toBe('Hello World');
  });

  it('should update state when input changes', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(input, binding, uus);

    // Simulate user typing
    input.value = 'New message';
    input.dispatchEvent(new Event('input'));

    expect(uus.state.message).toBe('New message');
  });

  it('should handle checkbox inputs', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);

    const binding = {
      expression: 'isChecked',
      arg: undefined,
      modifiers: {},
      value: 'isChecked',
    };

    modelDirective.bind!(checkbox, binding, uus);

    // Initial state should set checkbox
    expect(checkbox.checked).toBe(true);

    // Simulate user clicking checkbox
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));

    expect(uus.state.isChecked).toBe(false);
  });

  it('should handle number inputs', () => {
    const input = document.createElement('input');
    input.type = 'number';
    document.body.appendChild(input);

    const binding = {
      expression: 'numberValue',
      arg: undefined,
      modifiers: {},
      value: 'numberValue',
    };

    modelDirective.bind!(input, binding, uus);

    expect(input.value).toBe('42');

    // Simulate user changing number
    input.value = '100';
    input.dispatchEvent(new Event('input'));

    expect(uus.state.numberValue).toBe(100);
  });

  it('should handle select elements', () => {
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    `;
    document.body.appendChild(select);

    const binding = {
      expression: 'selectedOption',
      arg: undefined,
      modifiers: {},
      value: 'selectedOption',
    };

    modelDirective.bind!(select, binding, uus);

    expect(select.value).toBe('option2');

    // Simulate user selecting different option
    select.value = 'option3';
    select.dispatchEvent(new Event('change'));

    expect(uus.state.selectedOption).toBe('option3');
  });

  it('should handle textarea elements', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(textarea, binding, uus);

    expect(textarea.value).toBe('Hello World');

    textarea.value = 'Multi-line\ntext content';
    textarea.dispatchEvent(new Event('input'));

    expect(uus.state.message).toBe('Multi-line\ntext content');
  });

  it('should handle nested object properties', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'user.name',
      arg: undefined,
      modifiers: {},
      value: 'user.name',
    };

    modelDirective.bind!(input, binding, uus);

    expect(input.value).toBe('John');

    input.value = 'Jane';
    input.dispatchEvent(new Event('input'));

    expect(uus.state.user.name).toBe('Jane');
  });

  it('should handle radio buttons', () => {
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'yes';
    document.body.appendChild(radio);

    uus.state.radioValue = 'yes';

    const binding = {
      expression: 'radioValue',
      arg: undefined,
      modifiers: {},
      value: 'radioValue',
    };

    modelDirective.bind!(radio, binding, uus);

    // Radio should be checked because state matches value
    expect(radio.checked).toBe(true);
  });

  it('should error on invalid elements', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const div = document.createElement('div');

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(div as any, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith(
      'uus-model can only be used on input, textarea, or select elements'
    );
    consoleSpy.mockRestore();
  });

  it('should handle null/undefined values', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    uus.state.nullValue = null;

    const binding = {
      expression: 'nullValue',
      arg: undefined,
      modifiers: {},
      value: 'nullValue',
    };

    modelDirective.bind!(input, binding, uus);

    expect(input.value).toBe('');
  });

  it('should handle evaluation errors when reading state', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'nonExistent.property',
      arg: undefined,
      modifiers: {},
      value: 'nonExistent.property',
    };

    modelDirective.bind!(input, binding, uus);

    // The evaluator catches errors first
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UUS_EVALUATION_ERROR]')
    );
    consoleSpy.mockRestore();
  });

  it('should handle errors when updating state', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'nonExistent.deep.property',
      arg: undefined,
      modifiers: {},
      value: 'nonExistent.deep.property',
    };

    modelDirective.bind!(input, binding, uus);

    // Try to update - this will trigger both evaluator error and model error
    input.value = 'new value';
    input.dispatchEvent(new Event('input'));

    // Should have errors from both evaluator and model
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error'),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should handle empty expression', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: '',
    };

    // Should not throw
    expect(() => {
      modelDirective.bind!(input, binding, uus);
    }).not.toThrow();
  });

  it('should clean up event listeners on unbind', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(input, binding, uus);

    expect(uus.cleanups.has(input)).toBe(true);

    modelDirective.unbind!(input, binding, uus);

    expect(uus.cleanups.has(input)).toBe(false);
  });

  it('should handle both input and change events', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    const binding = {
      expression: 'message',
      arg: undefined,
      modifiers: {},
      value: 'message',
    };

    modelDirective.bind!(input, binding, uus);

    // Test input event
    input.value = 'Input event';
    input.dispatchEvent(new Event('input'));
    expect(uus.state.message).toBe('Input event');

    // Test change event
    input.value = 'Change event';
    input.dispatchEvent(new Event('change'));
    expect(uus.state.message).toBe('Change event');
  });

  it('should handle deeply nested properties', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    uus.state.deep = { nested: { property: 'initial' } };

    const binding = {
      expression: 'deep.nested.property',
      arg: undefined,
      modifiers: {},
      value: 'deep.nested.property',
    };

    modelDirective.bind!(input, binding, uus);

    expect(input.value).toBe('initial');

    input.value = 'updated';
    input.dispatchEvent(new Event('input'));

    expect(uus.state.deep.nested.property).toBe('updated');
  });

  it('should handle checkbox with falsy initial value', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);

    uus.state.falsyValue = false;

    const binding = {
      expression: 'falsyValue',
      arg: undefined,
      modifiers: {},
      value: 'falsyValue',
    };

    modelDirective.bind!(checkbox, binding, uus);

    expect(checkbox.checked).toBe(false);

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(uus.state.falsyValue).toBe(true);
  });
});
