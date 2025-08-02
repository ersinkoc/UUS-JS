import type { Directive, ContentDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { DirectiveError, ErrorCategory, validate } from '../errors';
import { asDirectiveName, asExpressionString } from '../type-guards';

export const textDirective: Directive<ContentDirectiveBinding> = {
  name: asDirectiveName('text'),
  bind(el, binding, uus) {
    try {
      // Validate inputs
      validate('el', el, {
        required: true,
        custom: (value) => value instanceof HTMLElement ? true : 'Element must be an HTMLElement'
      });

      validate('binding', binding, {
        required: true,
        type: 'object'
      });

      validate('uus', uus, {
        required: true,
        type: 'object'
      });

      const evaluator = createSafeEvaluator(uus.state);

      const cleanup = effect(() => {
        const context = {
          element: el,
          directive: 'text',
          expression: binding.expression
        };

        const value = uus.errorHandler.safe(
          () => evaluator(binding.expression ? asExpressionString(binding.expression) : asExpressionString('')),
          ErrorCategory.EVALUATION,
          context,
          '' // Default to empty string on evaluation failure
        );

        // Safely update text content
        uus.errorHandler.safe(
          () => {
            el.textContent = String(value ?? '');
          },
          ErrorCategory.DIRECTIVE,
          { ...context, phase: 'dom-update', value },
          undefined
        );
      });

      // Store cleanup function
      const cleanups = uus.cleanups.get(el) || new Set();
      cleanups.add(cleanup);
      uus.cleanups.set(el, cleanups);

    } catch (error) {
      const directiveError = new DirectiveError(
        'text',
        'bind',
        error instanceof Error ? error : new Error(String(error)),
        { element: el, expression: binding.expression }
      );
      uus.errorHandler.handle(directiveError);
    }
  },
  
  unbind(el, _, uus) {
    try {
      const cleanups = uus.cleanups.get(el);
      if (cleanups) {
        cleanups.forEach((cleanup) => {
          uus.errorHandler.safe(
            () => cleanup(),
            ErrorCategory.DIRECTIVE,
            { element: el, directive: 'text', phase: 'unbind' },
            undefined
          );
        });
        uus.cleanups.delete(el);
      }
    } catch (error) {
      uus.errorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'text', phase: 'unbind' }
      );
    }
  },
};
