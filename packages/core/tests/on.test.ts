import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onDirective } from '../src/directives/on';
import { Uus } from '../src/uus';

describe('On Directive', () => {
  let uus: Uus;
  let element: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    uus = new Uus();
    element = document.createElement('button');
    element.textContent = 'Click me';
    document.body.appendChild(element);
    
    // Set up basic state
    uus.state.count = 0;
    uus.state.message = 'initial';
    uus.state.clicked = false;
  });

  it('should handle click events', () => {
    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: {},
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    // Simulate click
    element.click();

    expect(uus.state.count).toBe(1);
  });

  it('should handle multiple event types', () => {
    let mouseOverBinding = {
      expression: 'message = "hovered"',
      arg: 'mouseover',
      modifiers: {},
      value: 'message = "hovered"'
    };

    onDirective.bind!(element, mouseOverBinding, uus);

    // Simulate mouseover
    element.dispatchEvent(new Event('mouseover'));

    expect(uus.state.message).toBe('hovered');
  });

  it('should handle prevent modifier', () => {
    const mockEvent = new Event('click', { cancelable: true });
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { prevent: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    // Dispatch the event manually to control it
    element.dispatchEvent(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(uus.state.count).toBe(1);
  });

  it('should handle stop modifier', () => {
    const mockEvent = new Event('click', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { stop: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    element.dispatchEvent(mockEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(uus.state.count).toBe(1);
  });

  it('should handle multiple modifiers', () => {
    const mockEvent = new Event('click', { cancelable: true, bubbles: true });
    const preventDefaultSpy = vi.spyOn(mockEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(mockEvent, 'stopPropagation');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { prevent: true, stop: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    element.dispatchEvent(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(uus.state.count).toBe(1);
  });

  it('should handle once modifier', () => {
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { once: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    // First click
    element.click();
    expect(uus.state.count).toBe(1);
    
    // Verify event listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalled();

    // Second click should not increment (handler removed)
    element.click();
    expect(uus.state.count).toBe(1); // Still 1, not 2
  });

  it('should handle capture modifier', () => {
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { capture: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      expect.objectContaining({ capture: true })
    );
  });

  it('should handle passive modifier', () => {
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: { passive: true },
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      expect.objectContaining({ passive: true })
    );
  });

  it('should provide $event in expression context', () => {
    const binding = {
      expression: 'message = $event.type',
      arg: 'click',
      modifiers: {},
      value: 'message = $event.type'
    };

    onDirective.bind!(element, binding, uus);

    element.click();

    expect(uus.state.message).toBe('click');
  });

  it('should clean up $event after handler execution', () => {
    const binding = {
      expression: 'message = $event.type',
      arg: 'click',
      modifiers: {},
      value: 'message = $event.type'
    };

    onDirective.bind!(element, binding, uus);

    element.click();

    // $event should be cleaned up from state
    expect(uus.state.$event).toBeUndefined();
  });

  it('should handle error when no event type provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'count++',
      arg: undefined, // No event type
      modifiers: {},
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);

    expect(consoleSpy).toHaveBeenCalledWith('Event type required for uus-on');
    consoleSpy.mockRestore();
  });

  it('should handle evaluation errors in event handler', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const binding = {
      expression: 'nonExistentProperty.method()',
      arg: 'click',
      modifiers: {},
      value: 'nonExistentProperty.method()'
    };

    onDirective.bind!(element, binding, uus);

    element.click();

    // The evaluator catches errors first
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error evaluating expression'), expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should handle empty expression', () => {
    const binding = {
      expression: '',
      arg: 'click',
      modifiers: {},
      value: ''
    };

    onDirective.bind!(element, binding, uus);

    // Should not throw when clicking
    expect(() => {
      element.click();
    }).not.toThrow();
  });

  it('should handle complex expressions with event data', () => {
    const binding = {
      expression: 'message = $event.target.tagName.toLowerCase()',
      arg: 'click',
      modifiers: {},
      value: 'message = $event.target.tagName.toLowerCase()'
    };

    onDirective.bind!(element, binding, uus);

    element.click();

    expect(uus.state.message).toBe('button');
  });

  it('should handle conditional expressions', () => {
    const binding = {
      expression: 'count = count > 5 ? 0 : count + 1',
      arg: 'click',
      modifiers: {},
      value: 'count = count > 5 ? 0 : count + 1'
    };

    onDirective.bind!(element, binding, uus);

    // Click 7 times: 0->1->2->3->4->5->6->0->1
    for (let i = 0; i < 7; i++) {
      element.click();
    }

    // After 7 clicks: count goes 0,1,2,3,4,5,6,0
    expect(uus.state.count).toBe(0);
  });

  it('should clean up event listeners on unbind', () => {
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: {},
      value: 'count++'
    };

    onDirective.bind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(true);
    
    onDirective.unbind!(element, binding, uus);
    
    expect(uus.cleanups.has(element)).toBe(false);
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('should handle unbind with no cleanups', () => {
    const binding = {
      expression: 'count++',
      arg: 'click',
      modifiers: {},
      value: 'count++'
    };

    // Call unbind without bind first
    expect(() => {
      onDirective.unbind!(element, binding, uus);
    }).not.toThrow();
  });

  it('should handle keyboard events', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const binding = {
      expression: 'message = $event.key',
      arg: 'keydown',
      modifiers: {},
      value: 'message = $event.key'
    };

    onDirective.bind!(input, binding, uus);

    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    input.dispatchEvent(keyEvent);

    expect(uus.state.message).toBe('Enter');
  });

  it('should handle form events', () => {
    const form = document.createElement('form');
    document.body.appendChild(form);

    const binding = {
      expression: 'clicked = true',
      arg: 'submit',
      modifiers: { prevent: true },
      value: 'clicked = true'
    };

    onDirective.bind!(form, binding, uus);

    const submitEvent = new Event('submit', { cancelable: true });
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');
    
    form.dispatchEvent(submitEvent);

    expect(uus.state.clicked).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle custom events', () => {
    const binding = {
      expression: 'message = "custom event triggered"',
      arg: 'custom',
      modifiers: {},
      value: 'message = "custom event triggered"'
    };

    onDirective.bind!(element, binding, uus);

    const customEvent = new CustomEvent('custom');
    element.dispatchEvent(customEvent);

    expect(uus.state.message).toBe('custom event triggered');
  });

  it('should handle method calls in expressions', () => {
    // Add a method to state
    uus.state.updateMessage = (text: string) => {
      uus.state.message = text;
    };

    const binding = {
      expression: 'updateMessage("method called")',
      arg: 'click',
      modifiers: {},
      value: 'updateMessage("method called")'
    };

    onDirective.bind!(element, binding, uus);

    element.click();

    expect(uus.state.message).toBe('method called');
  });

  it('should handle event object properties', () => {
    const binding = {
      expression: 'clicked = $event.bubbles',
      arg: 'click',
      modifiers: {},
      value: 'clicked = $event.bubbles'
    };

    onDirective.bind!(element, binding, uus);

    // Default click event has bubbles: true
    element.click();

    expect(uus.state.clicked).toBe(true);
  });
});