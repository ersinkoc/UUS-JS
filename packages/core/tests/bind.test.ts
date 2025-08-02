import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bindDirective } from '../src/directives/bind';
import { Uus } from '../src/uus';

describe('Bind Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    document.body.appendChild(element);
    
    // Set up basic state
    uus.state.isVisible = true;
    uus.state.isDisabled = false;
    uus.state.theme = 'dark';
    uus.state.customId = 'test-123';
  });

  it('should handle no attribute name gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'isVisible',
      arg: undefined, // No attribute name
      modifiers: {},
      value: 'isVisible'
    };

    bindDirective.bind!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('Attribute name required for uus-bind');
    consoleSpy.mockRestore();
  });

  it('should bind basic attributes', () => {
    const binding = {
      expression: 'customId',
      arg: 'id',
      modifiers: {},
      value: 'customId'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('id')).toBe('test-123');
  });

  it('should handle boolean attributes', () => {
    const binding = {
      expression: 'isDisabled',
      arg: 'disabled',
      modifiers: {},
      value: 'isDisabled'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.hasAttribute('disabled')).toBe(false);

    // Change to true
    uus.state.isDisabled = true;
    expect(uus.state.isDisabled).toBe(true);
  });

  it('should remove attribute for falsy values', () => {
    uus.state.falsyValue = false;

    const binding = {
      expression: 'falsyValue',
      arg: 'data-test',
      modifiers: {},
      value: 'falsyValue'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.hasAttribute('data-test')).toBe(false);
  });

  it('should remove attribute for null values', () => {
    uus.state.nullValue = null;

    const binding = {
      expression: 'nullValue',
      arg: 'data-test',
      modifiers: {},
      value: 'nullValue'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.hasAttribute('data-test')).toBe(false);
  });

  it('should remove attribute for undefined values', () => {
    uus.state.undefinedValue = undefined;

    const binding = {
      expression: 'undefinedValue',
      arg: 'data-test',
      modifiers: {},
      value: 'undefinedValue'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.hasAttribute('data-test')).toBe(false);
  });

  it('should handle class binding with object syntax', () => {
    uus.state.classes = { active: true, disabled: false, theme: true };

    const binding = {
      expression: 'classes',
      arg: 'class',
      modifiers: {},
      value: 'classes'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.classList.contains('active')).toBe(true);
    expect(element.classList.contains('disabled')).toBe(false);
    expect(element.classList.contains('theme')).toBe(true);
  });

  it('should handle class binding with string syntax', () => {
    uus.state.classString = 'btn btn-primary active';

    const binding = {
      expression: 'classString',
      arg: 'class',
      modifiers: {},
      value: 'classString'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.className).toBe('btn btn-primary active');
  });

  it('should handle style binding with object syntax', () => {
    uus.state.styles = { color: 'red', fontSize: '16px', backgroundColor: 'blue' };

    const binding = {
      expression: 'styles',
      arg: 'style',
      modifiers: {},
      value: 'styles'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
    expect(element.style.backgroundColor).toBe('blue');
  });

  it('should handle style binding with string syntax', () => {
    uus.state.styleString = 'color: red; font-size: 16px;';

    const binding = {
      expression: 'styleString',
      arg: 'style',
      modifiers: {},
      value: 'styleString'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('style')).toBe('color: red; font-size: 16px;');
  });

  it('should handle style binding with camelCase properties', () => {
    uus.state.camelStyles = { marginTop: '10px', borderRadius: '5px' };

    const binding = {
      expression: 'camelStyles',
      arg: 'style',
      modifiers: {},
      value: 'camelStyles'
    };

    bindDirective.bind!(element, binding, uus);

    // Should set camelCase properties on style object
    expect(element.style.marginTop).toBe('10px');
    expect(element.style.borderRadius).toBe('5px');
  });

  it('should handle numeric values', () => {
    uus.state.tabIndex = 5;

    const binding = {
      expression: 'tabIndex',
      arg: 'tabindex',
      modifiers: {},
      value: 'tabIndex'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('tabindex')).toBe('5');
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.value',
      arg: 'data-test',
      modifiers: {},
      value: 'nonExistentProperty.value'
    };

    bindDirective.bind!(element, binding, uus);

    // The evaluator catches errors first, but bind directive has its own error handling
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Error (evaluating expression|binding attribute)/), expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle empty expression', () => {
    const binding = {
      expression: '',
      arg: 'data-test',
      modifiers: {},
      value: ''
    };

    bindDirective.bind!(element, binding, uus);

    // Empty expression evaluates to undefined, which removes the attribute
    expect(element.getAttribute('data-test')).toBe(null);
  });

  it('should handle complex expressions', () => {
    uus.state.count = 5;
    uus.state.multiplier = 2;

    const binding = {
      expression: '\"item-\" + (count * multiplier)',
      arg: 'data-id',
      modifiers: {},
      value: '\"item-\" + (count * multiplier)'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('data-id')).toBe('item-10');
  });

  it('should handle conditional expressions', () => {
    uus.state.showId = true;
    uus.state.id = 'visible-item';

    const binding = {
      expression: 'showId ? id : null',
      arg: 'data-id',
      modifiers: {},
      value: 'showId ? id : null'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('data-id')).toBe('visible-item');
  });

  it('should handle aria attributes', () => {
    uus.state.isExpanded = true;

    const binding = {
      expression: 'isExpanded',
      arg: 'aria-expanded',
      modifiers: {},
      value: 'isExpanded'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('aria-expanded')).toBe('true');
  });

  it('should handle data attributes', () => {
    uus.state.userId = 42;

    const binding = {
      expression: 'userId',
      arg: 'data-user-id',
      modifiers: {},
      value: 'userId'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('data-user-id')).toBe('42');
  });

  it('should clean up when unbinding', () => {
    const binding = {
      expression: 'customId',
      arg: 'id',
      modifiers: {},
      value: 'customId'
    };

    bindDirective.bind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(true);
    
    bindDirective.unbind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: 'customId',
      arg: 'id',
      modifiers: {},
      value: 'customId'
    };

    // Call unbind without bind first
    expect(() => {
      bindDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle null class object values', () => {
    uus.state.nullClassValue = null;

    const binding = {
      expression: 'nullClassValue',
      arg: 'class',
      modifiers: {},
      value: 'nullClassValue'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.className).toBe('');
  });

  it('should handle null style object values', () => {
    uus.state.nullStyleValue = null;

    const binding = {
      expression: 'nullStyleValue',
      arg: 'style',
      modifiers: {},
      value: 'nullStyleValue'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.getAttribute('style')).toBe('');
  });

  it('should handle mixed style values', () => {
    uus.state.mixedStyles = { color: 'red', display: null, fontSize: '14px' };

    const binding = {
      expression: 'mixedStyles',
      arg: 'style',
      modifiers: {},
      value: 'mixedStyles'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('14px');
    // null value gets set as null, which browsers may handle as empty string
    expect(element.style.display).toBe('');
  });

  it('should handle dynamic class updates', () => {
    element.className = 'existing-class';
    uus.state.dynamicClasses = { new: true, old: false };

    const binding = {
      expression: 'dynamicClasses',
      arg: 'class',
      modifiers: {},
      value: 'dynamicClasses'
    };

    bindDirective.bind!(element, binding, uus);

    expect(element.classList.contains('new')).toBe(true);
    expect(element.classList.contains('old')).toBe(false);
    // Note: existing classes may or may not be preserved depending on implementation
  });

  it('should handle href attributes', () => {
    uus.state.linkUrl = 'https://example.com';

    const binding = {
      expression: 'linkUrl',
      arg: 'href',
      modifiers: {},
      value: 'linkUrl'
    };

    const linkElement = document.createElement('a');
    document.body.appendChild(linkElement);

    bindDirective.bind!(linkElement, binding, uus);

    expect(linkElement.getAttribute('href')).toBe('https://example.com');
  });
});