import type { Directive, StateDirectiveBinding } from '../types';
import { createReactive } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { asDirectiveName, asExpressionString } from '../type-guards';

export const stateDirective: Directive<StateDirectiveBinding> = {
  name: asDirectiveName('state'),
  init(el, binding, uus) {
    try {
      const expression = binding.expression ? asExpressionString(binding.expression) : asExpressionString('{}');

      // Create evaluator with current global context for parsing object literals
      const evaluator = createSafeEvaluator(uus.state || {});
      const initialState = evaluator(expression);

      if (
        typeof initialState !== 'object' ||
        initialState === null ||
        Array.isArray(initialState)
      ) {
        throw new Error('uus-state must be an object');
      }

      // Merge with existing state or create new reactive state
      const reactiveState = createReactive(
        initialState as Record<string, unknown>
      );

      // Merge into the main state
      if (!uus.state) {
        (uus as any).state = reactiveState;
      } else {
        Object.assign(uus.state, reactiveState);
      }

      // Store state reference on element for child directives
      (el as HTMLElement & { __uusState: Record<string, unknown> }).__uusState =
        reactiveState;
    } catch (error) {
      console.error('Error initializing state:', error);
    }
  },
};
