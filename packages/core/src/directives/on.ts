import type { 
  Directive, 
  EventDirectiveBinding, 
  EventName, 
  EventHandler 
} from '../types';
import { createSafeEvaluator, evaluateAsEventHandler } from '../evaluator';
import { 
  isEventDirectiveBinding, 
  isHTMLElement, 
  isDOMEvent,
  asDirectiveName,
  asExpressionString
} from '../type-guards';

export const onDirective: Directive<EventDirectiveBinding> = {
  name: asDirectiveName('on'),
  bind(el, binding, uus) {
    // Type validation
    if (!isHTMLElement(el)) {
      console.error('on directive requires an HTML element');
      return;
    }

    if (!binding.arg) {
      console.error('Event type required for uus-on');
      return;
    }

    if (!isEventDirectiveBinding(binding)) {
      console.error('Invalid binding for on directive');
      return;
    }

    const eventType = binding.arg as EventName;

    const handler = (event: Event) => {
      // Type validation for safety
      if (!isDOMEvent(event)) {
        console.error('Invalid event object received');
        return;
      }

      try {
        // Handle event modifiers with type safety
        if (binding.modifiers?.prevent) {
          event.preventDefault();
        }
        if (binding.modifiers?.stop) {
          event.stopPropagation();
        }
        if (binding.modifiers?.self && event.target !== el) {
          return; // Only handle events from the element itself
        }

        // Evaluate event handler with enhanced type safety
        if (binding.expression) {
          const eventHandler = evaluateAsEventHandler(binding.expression, uus.state);
          
          if (typeof eventHandler === 'function') {
            // Execute as function with event parameter
            (eventHandler as Function)(event);
          } else {
            // Execute as expression with $event in scope
            const originalState = uus.state;
            // Add $event to the original state temporarily
            (originalState as any).$event = event;
            const tempEvaluator = createSafeEvaluator(originalState);
            tempEvaluator(asExpressionString(binding.expression));
            // Clean up $event
            delete (originalState as any).$event;
          }
        }

        // Handle once modifier
        if (binding.modifiers?.once) {
          el.removeEventListener(eventType, handler);
        }
      } catch (error) {
        uus.errorHandler.handleGenericError(
          error instanceof Error ? error : new Error(String(error)),
          'DIRECTIVE' as any,
          { 
            directive: 'on',
            eventType,
            expression: binding.expression
          }
        );
      }
    };

    // Handle event listener options with type safety
    const options: AddEventListenerOptions = {
      capture: Boolean(binding.modifiers?.capture),
      passive: Boolean(binding.modifiers?.passive),
      once: Boolean(binding.modifiers?.once)
    };

    el.addEventListener(eventType, handler, options);

    // Store cleanup function
    const cleanup = () => el.removeEventListener(eventType, handler, options);
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    uus.cleanups.set(el, cleanups);
    
    // Track event listener with memory manager if available
    if ((uus as any).memoryTracker) {
      (uus as any).memoryTracker.track('eventListener', el, cleanup, {
        eventType,
        element: el.tagName,
        expression: binding.expression
      });
    }
  },
  unbind(el, _, uus) {
    const cleanups = uus.cleanups.get(el);
    if (cleanups) {
      cleanups.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error during event listener cleanup:', error);
        }
      });
      uus.cleanups.delete(el);
    }
  },
};
