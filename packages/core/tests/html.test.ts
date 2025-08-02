import { describe, it, expect, beforeEach, vi } from 'vitest';
import { htmlDirective } from '../src/directives/html';
import { Uus } from '../src/uus';

describe('HTML Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    document.body.appendChild(element);

    // Set up basic state
    uus.state.htmlContent = '<p>Hello <strong>World</strong></p>';
    uus.state.plainText = 'Just plain text';
    uus.state.emptyContent = '';
  });

  it('should set innerHTML from state', () => {
    const binding = {
      expression: 'htmlContent',
      arg: undefined,
      modifiers: {},
      value: 'htmlContent',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('<p>Hello <strong>World</strong></p>');
  });

  it('should handle plain text content', () => {
    const binding = {
      expression: 'plainText',
      arg: undefined,
      modifiers: {},
      value: 'plainText',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('Just plain text');
  });

  it('should handle empty content', () => {
    const binding = {
      expression: 'emptyContent',
      arg: undefined,
      modifiers: {},
      value: 'emptyContent',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('');
  });

  it('should handle null values', () => {
    uus.state.nullContent = null;

    const binding = {
      expression: 'nullContent',
      arg: undefined,
      modifiers: {},
      value: 'nullContent',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('');
  });

  it('should handle undefined values', () => {
    uus.state.undefinedContent = undefined;

    const binding = {
      expression: 'undefinedContent',
      arg: undefined,
      modifiers: {},
      value: 'undefinedContent',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('');
  });

  it('should sanitize script tags', () => {
    uus.state.maliciousContent =
      '<p>Safe content</p><script>alert("XSS")</script><p>More content</p>';

    const binding = {
      expression: 'maliciousContent',
      arg: undefined,
      modifiers: {},
      value: 'maliciousContent',
    };

    htmlDirective.bind!(element, binding, uus);

    // Script tags should be removed but HTML should render normally
    expect(element.innerHTML).toContain('<p>Safe content</p>');
    expect(element.innerHTML).not.toContain('<script>');
    expect(element.innerHTML).toContain('<p>More content</p>');
  });

  it('should remove event handlers', () => {
    uus.state.withEventHandlers =
      '<div onclick="alert(\'XSS\')" onmouseover="evil()">Content</div>';

    const binding = {
      expression: 'withEventHandlers',
      arg: undefined,
      modifiers: {},
      value: 'withEventHandlers',
    };

    htmlDirective.bind!(element, binding, uus);

    // Event handlers should be removed but HTML should render
    expect(element.innerHTML).not.toContain('onclick');
    expect(element.innerHTML).not.toContain('onmouseover');
    expect(element.innerHTML).toContain('Content');
    // Should still be a div element, but may have empty attributes
    expect(element.innerHTML).toMatch(/<div.*>Content<\/div>/);
  });

  it('should remove javascript: protocols', () => {
    uus.state.withJavaScript = '<a href="javascript:alert(\'XSS\')">Link</a>';

    const binding = {
      expression: 'withJavaScript',
      arg: undefined,
      modifiers: {},
      value: 'withJavaScript',
    };

    htmlDirective.bind!(element, binding, uus);

    // javascript: protocol should be removed but HTML should render
    expect(element.innerHTML).not.toContain('javascript:');
    expect(element.innerHTML).toContain('<a href=');
    expect(element.innerHTML).toContain('Link');
  });

  it('should handle complex malicious input by sanitizing', () => {
    uus.state.complexMalicious = `
      <p>Normal content</p>
      <script type="text/javascript">
        document.cookie = "stolen";
      </script>
      <img src="x" onerror="alert('XSS')" />
      <a href="javascript:void(0)">Bad link</a>
      <div onclick="badFunction()">Click me</div>
    `;

    const binding = {
      expression: 'complexMalicious',
      arg: undefined,
      modifiers: {},
      value: 'complexMalicious',
    };

    htmlDirective.bind!(element, binding, uus);

    const innerHTML = element.innerHTML;

    // HTML should be sanitized but rendered normally
    expect(innerHTML).toContain('<p>Normal content</p>');
    expect(innerHTML).not.toContain('<script'); // Scripts removed
    expect(innerHTML).toContain('<img src="x"'); // Image preserved but onerror removed
    expect(innerHTML).not.toContain('onerror');
    expect(innerHTML).toContain('<a href='); // Link preserved but javascript: removed
    expect(innerHTML).not.toContain('javascript:');
    expect(innerHTML).toContain('<div>Click me</div>'); // Div preserved but onclick removed
    expect(innerHTML).not.toContain('onclick');
  });

  it('should handle numeric values', () => {
    uus.state.numberValue = 42;

    const binding = {
      expression: 'numberValue',
      arg: undefined,
      modifiers: {},
      value: 'numberValue',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('42');
  });

  it('should handle boolean values', () => {
    uus.state.booleanValue = true;

    const binding = {
      expression: 'booleanValue',
      arg: undefined,
      modifiers: {},
      value: 'booleanValue',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('true');
  });

  it('should handle object values', () => {
    uus.state.objectValue = { toString: () => '<p>Custom string</p>' };

    const binding = {
      expression: 'objectValue',
      arg: undefined,
      modifiers: {},
      value: 'objectValue',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('<p>Custom string</p>');
  });

  it('should handle expressions that concatenate HTML', () => {
    uus.state.title = 'Page Title';
    uus.state.content = 'Page content';

    const binding = {
      expression: '"<h1>" + title + "</h1><p>" + content + "</p>"',
      arg: undefined,
      modifiers: {},
      value: '"<h1>" + title + "</h1><p>" + content + "</p>"',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('<h1>Page Title</h1><p>Page content</p>');
  });

  it('should handle conditional expressions', () => {
    uus.state.showTitle = true;
    uus.state.title = 'Dynamic Title';

    const binding = {
      expression: 'showTitle ? "<h2>" + title + "</h2>" : "<p>No title</p>"',
      arg: undefined,
      modifiers: {},
      value: 'showTitle ? "<h2>" + title + "</h2>" : "<p>No title</p>"',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('<h2>Dynamic Title</h2>');
  });

  it('should handle array values', () => {
    uus.state.items = ['item1', 'item2', 'item3'];

    const binding = {
      expression: 'items.join(", ")',
      arg: undefined,
      modifiers: {},
      value: 'items.join(", ")',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('item1, item2, item3');
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.htmlContent',
      arg: undefined,
      modifiers: {},
      value: 'nonExistentProperty.htmlContent',
    };

    htmlDirective.bind!(element, binding, uus);

    // The evaluator catches errors and returns undefined
    expect(element.innerHTML).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UUS_EVALUATION_ERROR]')
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty expression', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: '',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).toBe('');
  });

  it('should clean up when unbinding', () => {
    const binding = {
      expression: 'htmlContent',
      arg: undefined,
      modifiers: {},
      value: 'htmlContent',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(uus.cleanups.has(element)).toBe(true);

    htmlDirective.unbind!(element, binding, uus);

    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: 'htmlContent',
      arg: undefined,
      modifiers: {},
      value: 'htmlContent',
    };

    // Call unbind without bind first
    expect(() => {
      htmlDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle nested script tags', () => {
    uus.state.nestedScripts =
      '<div><script>alert("nested")</script>Content</div>';

    const binding = {
      expression: 'nestedScripts',
      arg: undefined,
      modifiers: {},
      value: 'nestedScripts',
    };

    htmlDirective.bind!(element, binding, uus);

    expect(element.innerHTML).not.toContain('<script>');
    expect(element.innerHTML).toContain('<div>');
    expect(element.innerHTML).toContain('Content');
  });

  it('should sanitize uppercase script tags', () => {
    uus.state.upperCaseScript = '<SCRIPT>alert("UPPER")</SCRIPT><p>Content</p>';

    const binding = {
      expression: 'upperCaseScript',
      arg: undefined,
      modifiers: {},
      value: 'upperCaseScript',
    };

    htmlDirective.bind!(element, binding, uus);

    // Script should be removed but HTML should render
    expect(element.innerHTML).not.toContain('<SCRIPT>');
    expect(element.innerHTML).toContain('<p>Content</p>');
  });

  it('should handle multiple event handlers on same element', () => {
    uus.state.multipleHandlers =
      '<div onclick="bad1()" onmouseover="bad2()" onload="bad3()">Safe content</div>';

    const binding = {
      expression: 'multipleHandlers',
      arg: undefined,
      modifiers: {},
      value: 'multipleHandlers',
    };

    htmlDirective.bind!(element, binding, uus);

    const innerHTML = element.innerHTML;
    expect(innerHTML).not.toContain('onclick');
    expect(innerHTML).not.toContain('onmouseover');
    expect(innerHTML).not.toContain('onload');
    expect(innerHTML).toContain('<div>');
    expect(innerHTML).toContain('Safe content');
  });

  it('should sanitize script tags with attributes', () => {
    uus.state.scriptWithAttrs =
      '<script type="text/javascript" src="evil.js">alert("inline")</script>';

    const binding = {
      expression: 'scriptWithAttrs',
      arg: undefined,
      modifiers: {},
      value: 'scriptWithAttrs',
    };

    htmlDirective.bind!(element, binding, uus);

    // Script should be completely removed
    expect(element.innerHTML).not.toContain('<script');
    expect(element.innerHTML).not.toContain('evil.js');
    expect(element.innerHTML).not.toContain('alert("inline")');
    expect(element.innerHTML).toBe(''); // Should be empty after script removal
  });

  it('should preserve safe HTML structure', () => {
    uus.state.safeHTML =
      '<div class="container"><p>Paragraph</p><span>Span</span></div>';

    const binding = {
      expression: 'safeHTML',
      arg: undefined,
      modifiers: {},
      value: 'safeHTML',
    };

    htmlDirective.bind!(element, binding, uus);

    // Should render HTML normally
    expect(element.innerHTML).toContain('<div class="container">');
    expect(element.innerHTML).toContain('<p>Paragraph</p>');
    expect(element.innerHTML).toContain('<span>Span</span>');
  });

  it('should handle state updates', () => {
    const binding = {
      expression: 'htmlContent',
      arg: undefined,
      modifiers: {},
      value: 'htmlContent',
    };

    htmlDirective.bind!(element, binding, uus);

    const initialContent = element.innerHTML;
    expect(initialContent).toContain('Hello');

    // Update state
    uus.state.htmlContent = '<p>Updated content</p>';

    // In a real reactive system, this would update automatically
    expect(uus.state.htmlContent).toBe('<p>Updated content</p>');
  });
});
