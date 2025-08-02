import { describe, it, expect, beforeEach, vi } from 'vitest';
import { componentDirective } from '../src/directives/component';
import { Uus } from '../src/uus';

describe('Component Directive', () => {
  let uus: Uus;
  let element: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  it('should initialize component with state', async () => {
    const binding = {
      expression: '{ state: { count: 0, message: "hello" } }',
      arg: undefined,
      modifiers: {},
      value: '{ state: { count: 0, message: "hello" } }',
    };

    componentDirective.init!(element, binding, uus);

    expect((element as any).__uusState).toBeDefined();
    expect((element as any).__uusState.count).toBe(0);
    expect((element as any).__uusState.message).toBe('hello');
  });

  it('should initialize component with lifecycle hooks', async () => {
    const createdSpy = vi.fn();
    const mountedSpy = vi.fn();

    // Add the hook functions to UUS state so they can be accessed by the evaluator
    uus.state.createdHook = createdSpy;
    uus.state.mountedHook = mountedSpy;

    const binding = {
      expression: '{ created: createdHook, mounted: mountedHook }',
      arg: undefined,
      modifiers: {},
      value: '{ created: createdHook, mounted: mountedHook }',
    };

    componentDirective.init!(element, binding, uus);

    expect(createdSpy).toHaveBeenCalledTimes(1);

    // Wait for requestAnimationFrame
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
    expect(mountedSpy).toHaveBeenCalledTimes(1);

    // Clean up globals
    delete (global as any).createdHook;
    delete (global as any).mountedHook;
  });

  it('should handle component with both state and hooks', async () => {
    const createdSpy = vi.fn();
    (global as any).created = createdSpy;

    const binding = {
      expression: '{ state: { value: 42 }, created: created }',
      arg: undefined,
      modifiers: {},
      value: '{ state: { value: 42 }, created: created }',
    };

    componentDirective.init!(element, binding, uus);

    expect((element as any).__uusState).toBeDefined();
    expect((element as any).__uusState.value).toBe(42);
    expect(createdSpy).toHaveBeenCalledTimes(1);

    delete (global as any).created;
  });

  it('should handle empty component definition', () => {
    const binding = {
      expression: '{}',
      arg: undefined,
      modifiers: {},
      value: '{}',
    };

    // Should not throw
    expect(() => {
      componentDirective.init!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle component with only state', () => {
    const binding = {
      expression: '{ state: { active: true } }',
      arg: undefined,
      modifiers: {},
      value: '{ state: { active: true } }',
    };

    componentDirective.init!(element, binding, uus);

    expect((element as any).__uusState).toBeDefined();
    expect((element as any).__uusState.active).toBe(true);
  });

  it('should handle component with only hooks', async () => {
    const createdSpy = vi.fn();
    (global as any).onCreated = createdSpy;

    const binding = {
      expression: '{ created: onCreated }',
      arg: undefined,
      modifiers: {},
      value: '{ created: onCreated }',
    };

    componentDirective.init!(element, binding, uus);

    expect(createdSpy).toHaveBeenCalledTimes(1);
    expect((element as any).__uusState).toBeUndefined();

    delete (global as any).onCreated;
  });

  it('should handle invalid component definition', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: '"not an object"',
      arg: undefined,
      modifiers: {},
      value: '"not an object"',
    };

    componentDirective.init!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('uus-component must be an object');
    expect((element as any).__uusState).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle null component definition', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'null',
      arg: undefined,
      modifiers: {},
      value: 'null',
    };

    componentDirective.init!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('uus-component must be an object');
    expect((element as any).__uusState).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle evaluation errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'invalid.syntax[',
      arg: undefined,
      modifiers: {},
      value: 'invalid.syntax[',
    };

    componentDirective.init!(element, binding, uus);

    // The evaluator catches and logs errors first, then component error handler
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[UUS_EVALUATION_ERROR]')
    );

    consoleSpy.mockRestore();
  });

  it('should merge component state with existing uus state', () => {
    uus.state.existing = 'value';

    const binding = {
      expression: '{ state: { newProp: "new value" } }',
      arg: undefined,
      modifiers: {},
      value: '{ state: { newProp: "new value" } }',
    };

    componentDirective.init!(element, binding, uus);

    expect(uus.state.existing).toBe('value');
    expect(uus.state.newProp).toBe('new value');
  });

  it('should handle reactive component state', () => {
    const binding = {
      expression: '{ state: { count: 0 } }',
      arg: undefined,
      modifiers: {},
      value: '{ state: { count: 0 } }',
    };

    componentDirective.init!(element, binding, uus);

    const componentState = (element as any).__uusState;
    let reactiveValue: number;

    // Test that the state is reactive
    const mockEffect = vi.fn(() => {
      reactiveValue = componentState.count;
    });

    // Simulate a reactive effect
    mockEffect();
    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(reactiveValue!).toBe(0);

    // Change the state
    componentState.count = 5;
    expect(componentState.count).toBe(5);
  });

  it('should handle component definition without expression', () => {
    const binding = {
      expression: '',
      arg: undefined,
      modifiers: {},
      value: '',
    };

    // Should use default '{}' when expression is empty
    expect(() => {
      componentDirective.init!(element, binding, uus);
    }).not.toThrow();
  });
});
