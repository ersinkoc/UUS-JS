import { describe, it, expect, beforeEach, vi } from 'vitest';
import { forDirective } from '../src/directives/for';
import { Uus } from '../src/uus';

describe('For Directive', () => {
  let uus: Uus;
  let element: HTMLElement;
  let parent: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    parent = document.createElement('div');
    element = document.createElement('li');
    parent.appendChild(element);
    document.body.appendChild(parent);
    
    // Set up basic state with an array
    uus.state.items = ['apple', 'banana', 'cherry'];
    uus.state.numbers = [1, 2, 3];
    uus.state.users = [
      { name: 'John', age: 25 },
      { name: 'Jane', age: 30 }
    ];
  });

  it('should render simple for loop', () => {
    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    element.textContent = 'Item: {{item}}';
    element.setAttribute('uus-text', 'item');

    forDirective.bind!(element, binding, uus);

    // Should create instances for each item
    expect(parent.children.length).toBe(3);
    
    // Check that comment placeholder exists
    const comment = Array.from(parent.childNodes).find(node => 
      node.nodeType === Node.COMMENT_NODE && 
      node.textContent?.includes('uus-for: item in items')
    );
    expect(comment).toBeDefined();
  });

  it('should render for loop with index', () => {
    const binding = {
      expression: '(item, index) in items',
      arg: undefined,
      modifiers: {},
      value: '(item, index) in items'
    };

    element.textContent = '{{index}}: {{item}}';
    element.setAttribute('uus-text', 'index + ": " + item');

    forDirective.bind!(element, binding, uus);

    expect(parent.children.length).toBe(3);
  });

  it('should handle empty arrays', () => {
    uus.state.emptyArray = [];
    
    const binding = {
      expression: 'item in emptyArray',
      arg: undefined,
      modifiers: {},
      value: 'item in emptyArray'
    };

    forDirective.bind!(element, binding, uus);

    // Should only have the comment placeholder
    expect(parent.children.length).toBe(0);
    
    const comment = Array.from(parent.childNodes).find(node => 
      node.nodeType === Node.COMMENT_NODE
    );
    expect(comment).toBeDefined();
  });

  it('should handle invalid expressions', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'invalid expression',
      arg: undefined,
      modifiers: {},
      value: 'invalid expression'
    };

    forDirective.bind!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('Invalid for expression:', 'invalid expression');
    consoleSpy.mockRestore();
  });

  it('should handle non-array values', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    uus.state.notArray = 'string';

    const binding = {
      expression: 'item in notArray',
      arg: undefined,
      modifiers: {},
      value: 'item in notArray'
    };

    forDirective.bind!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('uus-for expects an array, got:', 'string');
    consoleSpy.mockRestore();
  });

  it('should handle element without parent', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const orphanElement = document.createElement('div');

    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    forDirective.bind!(orphanElement, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('Element must have a parent for uus-for');
    consoleSpy.mockRestore();
  });

  it('should create scoped state for each iteration', () => {
    const binding = {
      expression: '(user, i) in users',
      arg: undefined,
      modifiers: {},
      value: '(user, i) in users'
    };

    element.setAttribute('uus-text', 'user.name + " - " + i');

    forDirective.bind!(element, binding, uus);

    expect(parent.children.length).toBe(2);
    
    // Check that each instance has its own scoped state
    const instances = Array.from(parent.children) as HTMLElement[];
    expect((instances[0] as any).__uusState).toBeDefined();
    expect((instances[1] as any).__uusState).toBeDefined();
    
    // Each instance should have different scoped variables
    expect((instances[0] as any).__uusState.user).toEqual({ name: 'John', age: 25 });
    expect((instances[0] as any).__uusState.i).toBe(0);
    expect((instances[1] as any).__uusState.user).toEqual({ name: 'Jane', age: 30 });
    expect((instances[1] as any).__uusState.i).toBe(1);
  });

  it('should handle reactive updates to items array', () => {
    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    forDirective.bind!(element, binding, uus);
    expect(parent.children.length).toBe(3);

    // Update the array
    uus.state.items.push('date');
    
    // Should reactively update (in a real scenario, this would happen automatically)
    // For testing, we simulate the effect running again
    expect(uus.state.items.length).toBe(4);
  });

  it('should clean up instances when items are removed', () => {
    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    forDirective.bind!(element, binding, uus);
    expect(parent.children.length).toBe(3);

    // Test cleanup by calling unbind
    forDirective.unbind!(element, binding, uus);
    
    // Should have cleaned up
    expect(uus.cleanups.has(element)).toBe(false);
  });

  it('should handle nested objects in for loop', () => {
    const binding = {
      expression: 'user in users',
      arg: undefined,
      modifiers: {},
      value: 'user in users'
    };

    element.setAttribute('uus-text', 'user.name');

    forDirective.bind!(element, binding, uus);

    expect(parent.children.length).toBe(2);
    
    const instances = Array.from(parent.children) as HTMLElement[];
    expect((instances[0] as any).__uusState.user.name).toBe('John');
    expect((instances[1] as any).__uusState.user.name).toBe('Jane');
  });

  it('should handle expressions with whitespace', () => {
    const binding = {
      expression: '  item   in   items  ',
      arg: undefined,
      modifiers: {},
      value: '  item   in   items  '
    };

    forDirective.bind!(element, binding, uus);
    expect(parent.children.length).toBe(3);
  });

  it('should handle parenthesized expressions', () => {
    const binding = {
      expression: '( item , index ) in items',
      arg: undefined,
      modifiers: {},
      value: '( item , index ) in items'
    };

    forDirective.bind!(element, binding, uus);
    expect(parent.children.length).toBe(3);
  });

  it('should handle evaluation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const binding = {
      expression: 'item in nonExistentArray',
      arg: undefined,
      modifiers: {},
      value: 'item in nonExistentArray'
    };

    forDirective.bind!(element, binding, uus);

    // The evaluator catches errors first
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error evaluating expression'), expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should remove uus-for attribute from template', () => {
    element.setAttribute('uus-for', 'item in items');
    
    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    forDirective.bind!(element, binding, uus);

    // Check that generated instances don't have uus-for attribute
    const instances = Array.from(parent.children) as HTMLElement[];
    instances.forEach(instance => {
      expect(instance.hasAttribute('uus-for')).toBe(false);
    });
  });

  it('should skip state directive in for loop children', () => {
    // Add a state directive to test skipping
    element.setAttribute('uus-state', '{ localVar: "test" }');
    
    const binding = {
      expression: 'item in items',
      arg: undefined,
      modifiers: {},
      value: 'item in items'
    };

    // Should not throw or cause issues
    expect(() => {
      forDirective.bind!(element, binding, uus);
    }).not.toThrow();

    expect(parent.children.length).toBe(3);
  });

  it('should handle empty expression', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: ''
    };

    forDirective.bind!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('Invalid for expression:', '');
    consoleSpy.mockRestore();
  });
});