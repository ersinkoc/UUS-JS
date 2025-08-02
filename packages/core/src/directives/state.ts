import type { Directive, UusInstance } from '../types';
import { createReactive } from '../reactive';
import { createSafeEvaluator } from '../evaluator';

export const stateDirective: Directive = {
  name: 'state',
  init(el, binding, uus) {
    try {
      const expression = binding.expression || '{}';
      
      // Create evaluator with current global context for parsing object literals
      const evaluator = createSafeEvaluator(uus.state || {});
      const initialState = evaluator(expression);
      
      if (typeof initialState !== 'object' || initialState === null || Array.isArray(initialState)) {
        throw new Error('uus-state must be an object');
      }

      // Merge with existing state or create new reactive state
      const reactiveState = createReactive(initialState);
      
      // Merge into the main state
      if (!uus.state) {
        uus.state = reactiveState;
      } else {
        Object.assign(uus.state, reactiveState);
      }

      // Store state reference on element for child directives
      (el as any).__uusState = reactiveState;
    } catch (error) {
      console.error('Error initializing state:', error);
    }
  },
};