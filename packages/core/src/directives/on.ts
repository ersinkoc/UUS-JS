import type { Directive, UusInstance } from '../types';
import { createSafeEvaluator } from '../evaluator';

export const onDirective: Directive = {
  name: 'on',
  bind(el, binding, uus) {
    if (!binding.arg) {
      console.error('Event type required for uus-on');
      return;
    }

    const eventType = binding.arg;
    const evaluator = createSafeEvaluator(uus.state);

    const handler = (event: Event) => {
      // Handle modifiers
      if (binding.modifiers?.prevent) {
        event.preventDefault();
      }
      if (binding.modifiers?.stop) {
        event.stopPropagation();
      }

      try {
        // Make event available in expression without copying the state
        // Create a temporary evaluator that knows about $event but uses the original state
        const originalState = uus.state;
        const tempEvaluator = createSafeEvaluator(originalState);
        
        // Temporarily add $event to the original state
        originalState.$event = event;
        
        tempEvaluator(binding.expression || '');
        
        // Clean up $event
        delete originalState.$event;
      } catch (error) {
        console.error('Error handling event:', error);
      }

      // Handle once modifier
      if (binding.modifiers?.once) {
        el.removeEventListener(eventType, handler);
      }
    };

    // Handle capture modifier
    const options = {
      capture: binding.modifiers?.capture || false,
      passive: binding.modifiers?.passive || false,
    };

    el.addEventListener(eventType, handler, options);

    // Store cleanup function
    const cleanup = () => el.removeEventListener(eventType, handler, options);
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    uus.cleanups.set(el, cleanups);
  },
  unbind(el, _, uus) {
    const cleanups = uus.cleanups.get(el);
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup());
      uus.cleanups.delete(el);
    }
  },
};