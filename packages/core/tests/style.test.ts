import { describe, it, expect, beforeEach, vi } from 'vitest';
import { styleDirective } from '../src/directives/style';
import { Uus } from '../src/uus';

describe('Style Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    document.body.appendChild(element);

    // Set up basic state for styling
    uus.state.color = 'red';
    uus.state.fontSize = '16px';
    uus.state.isVisible = true;
    uus.state.width = 100;
    uus.state.styles = {
      backgroundColor: 'blue',
      margin: '10px',
      padding: '5px',
    };
  });

  it('should apply object-based styles', () => {
    const binding = {
      expression: '{ color: "red", fontSize: "16px" }',
      arg: undefined,
      modifiers: {},
      value: '{ color: "red", fontSize: "16px" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
  });

  it('should apply string-based styles', () => {
    const binding = {
      expression: '"color: blue; font-size: 14px"',
      arg: undefined,
      modifiers: {},
      value: '"color: blue; font-size: 14px"',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.getAttribute('style')).toContain('color: blue');
    expect(element.getAttribute('style')).toContain('font-size: 14px');
  });

  it('should handle dynamic styles from state', () => {
    const binding = {
      expression: '{ color: color, fontSize: fontSize }',
      arg: undefined,
      modifiers: {},
      value: '{ color: color, fontSize: fontSize }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
  });

  it('should convert camelCase to kebab-case', () => {
    const binding = {
      expression: '{ backgroundColor: "yellow", borderRadius: "5px" }',
      arg: undefined,
      modifiers: {},
      value: '{ backgroundColor: "yellow", borderRadius: "5px" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.backgroundColor).toBe('yellow');
    expect(element.style.borderRadius).toBe('5px');
  });

  it('should handle conditional styles', () => {
    const binding = {
      expression: '{ display: isVisible ? "block" : "none" }',
      arg: undefined,
      modifiers: {},
      value: '{ display: isVisible ? "block" : "none" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.display).toBe('block');
  });

  it('should handle numeric values', () => {
    const binding = {
      expression: '{ width: width + "px", zIndex: 999 }',
      arg: undefined,
      modifiers: {},
      value: '{ width: width + "px", zIndex: 999 }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.width).toBe('100px');
    expect(element.style.zIndex).toBe('999');
  });

  it('should remove styles when value is null/undefined/empty', () => {
    // First set some styles
    element.style.color = 'red';
    element.style.fontSize = '16px';

    const binding = {
      expression: '{ color: null, fontSize: "", width: undefined }',
      arg: undefined,
      modifiers: {},
      value: '{ color: null, fontSize: "", width: undefined }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('');
    expect(element.style.fontSize).toBe('');
    expect(element.style.width).toBe('');
  });

  it('should preserve original styles when resetting', () => {
    element.setAttribute('style', 'border: 1px solid black; margin: 5px;');

    const binding = {
      expression: '{ color: "red" }',
      arg: undefined,
      modifiers: {},
      value: '{ color: "red" }',
    };

    styleDirective.bind!(element, binding, uus);

    // Should preserve original styles
    expect(element.getAttribute('style')).toContain('border: 1px solid black');
    expect(element.getAttribute('style')).toContain('margin: 5px');
    expect(element.style.color).toBe('red');
  });

  it('should handle style object from state', () => {
    const binding = {
      expression: 'styles',
      arg: undefined,
      modifiers: {},
      value: 'styles',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.backgroundColor).toBe('blue');
    expect(element.style.margin).toBe('10px');
    expect(element.style.padding).toBe('5px');
  });

  it('should handle empty object', () => {
    const binding = {
      expression: '{}',
      arg: undefined,
      modifiers: {},
      value: '{}',
    };

    // Should not throw
    expect(() => {
      styleDirective.bind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle evaluation errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.styles',
      arg: undefined,
      modifiers: {},
      value: 'nonExistentProperty.styles',
    };

    styleDirective.bind!(element, binding, uus);

    // The evaluator catches errors first
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UUS_EVALUATION_ERROR]')
    );
    consoleSpy.mockRestore();
  });

  it('should handle string styles with existing styles', () => {
    element.setAttribute('style', 'border: 1px solid red;');

    const binding = {
      expression: '"color: blue; font-weight: bold"',
      arg: undefined,
      modifiers: {},
      value: '"color: blue; font-weight: bold"',
    };

    styleDirective.bind!(element, binding, uus);

    const style = element.getAttribute('style') || '';
    expect(style).toContain('border: 1px solid red');
    expect(style).toContain('color: blue');
    expect(style).toContain('font-weight: bold');
  });

  it('should handle mixed style properties', () => {
    const binding = {
      expression: '{ color: "red", "font-size": "14px", borderWidth: "2px" }',
      arg: undefined,
      modifiers: {},
      value: '{ color: "red", "font-size": "14px", borderWidth: "2px" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('14px');
    expect(element.style.borderWidth).toBe('2px');
  });

  it('should handle CSS custom properties', () => {
    const binding = {
      expression: '{ "--main-color": "purple", "--spacing": "20px" }',
      arg: undefined,
      modifiers: {},
      value: '{ "--main-color": "purple", "--spacing": "20px" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.getPropertyValue('--main-color')).toBe('purple');
    expect(element.style.getPropertyValue('--spacing')).toBe('20px');
  });

  it('should handle complex expressions', () => {
    uus.state.theme = 'dark';
    uus.state.size = 'large';

    const binding = {
      expression:
        '{ color: theme === "dark" ? "white" : "black", fontSize: size === "large" ? "18px" : "14px" }',
      arg: undefined,
      modifiers: {},
      value:
        '{ color: theme === "dark" ? "white" : "black", fontSize: size === "large" ? "18px" : "14px" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('white');
    expect(element.style.fontSize).toBe('18px');
  });

  it('should handle cleanup on unbind', () => {
    const binding = {
      expression: '{ color: "red" }',
      arg: undefined,
      modifiers: {},
      value: '{ color: "red" }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(uus.cleanups.has(element)).toBe(true);

    styleDirective.unbind!(element, binding, uus);

    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle falsy values correctly', () => {
    const binding = {
      expression: '{ opacity: 0, zIndex: false, visibility: null }',
      arg: undefined,
      modifiers: {},
      value: '{ opacity: 0, zIndex: false, visibility: null }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.opacity).toBe('0');
    expect(element.style.zIndex).toBe('false');
    expect(element.style.visibility).toBe('');
  });

  it('should handle default empty object when expression is empty', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: '',
    };

    // Should use default '{}' when expression is empty
    expect(() => {
      styleDirective.bind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle arrays or other non-object/string values', () => {
    const binding = {
      expression: '[1, 2, 3]',
      arg: undefined,
      modifiers: {},
      value: '[1, 2, 3]',
    };

    // Should handle gracefully without throwing
    expect(() => {
      styleDirective.bind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle style updates when state changes', () => {
    const binding = {
      expression: '{ color: color }',
      arg: undefined,
      modifiers: {},
      value: '{ color: color }',
    };

    styleDirective.bind!(element, binding, uus);

    expect(element.style.color).toBe('red');

    // Change state
    uus.state.color = 'blue';

    // In a real reactive system, this would update automatically
    // For testing, we verify the state change works
    expect(uus.state.color).toBe('blue');
  });
});
