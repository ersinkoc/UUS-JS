import type { Directive, ConditionalDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import {
  DirectiveError,
  ErrorCategory,
  validate,
} from '../errors';
import { asDirectiveName, asExpressionString } from '../type-guards';

export const ifDirective: Directive<ConditionalDirectiveBinding> = {
  name: asDirectiveName('if'),
  bind(el, binding, uus) {
    try {
      // Validate inputs
      validate('el', el, {
        required: true,
        custom: (value) =>
          value instanceof HTMLElement
            ? true
            : 'Element must be an HTMLElement',
      });

      validate('binding', binding, {
        required: true,
        type: 'object',
      });

      if (!el.parentNode) {
        throw new DirectiveError(
          'if',
          'bind',
          new Error('Element must have a parent for uus-if directive'),
          { element: el }
        );
      }

      const evaluator = createSafeEvaluator(uus.state);
      const comment = document.createComment('uus-if');
      let parent = el.parentNode;

      // Track if this is first run and current visibility state
      let isFirstRun = true;
      let isShown = true; // Element starts in DOM

      const cleanup = effect(() => {
        const context = {
          element: el,
          directive: 'if',
          expression: binding.expression,
          isFirstRun,
          isShown,
        };

        // Safely evaluate condition
        const shouldShow = uus.errorHandler.safe(
          () => {
            const result = evaluator(
              binding.expression
                ? asExpressionString(binding.expression)
                : asExpressionString('true')
            );
            return Boolean(result); // Ensure boolean result
          },
          ErrorCategory.EVALUATION,
          context,
          false // Default to false on evaluation error for safety
        );

        // Handle first run - need to check initial condition
        if (isFirstRun) {
          isFirstRun = false;
          // If condition is false on first run, hide the element
          if (!shouldShow && isShown) {
            if (el.parentNode) {
              parent = el.parentNode;
              parent.replaceChild(comment, el);
              isShown = false;
            }
          }
          return;
        }

        // Safely handle DOM manipulation
        uus.errorHandler.safe(
          () => {
            if (shouldShow && !isShown) {
              // Show element - ensure we have the correct parent
              if (comment.parentNode) {
                parent = comment.parentNode;
                parent.replaceChild(el, comment);
                isShown = true;
              }
            } else if (!shouldShow && isShown) {
              // Hide element - ensure element is in DOM
              if (el.parentNode) {
                parent = el.parentNode;
                parent.replaceChild(comment, el);
                isShown = false;
              }
            }
          },
          ErrorCategory.DIRECTIVE,
          { ...context, phase: 'dom-manipulation', shouldShow },
          undefined
        );
      });

      // Store cleanup function
      const cleanups = uus.cleanups.get(el) || new Set();
      cleanups.add(cleanup);
      uus.cleanups.set(el, cleanups);
    } catch (error) {
      const directiveError =
        error instanceof DirectiveError
          ? error
          : new DirectiveError(
              'if',
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
            { element: el, directive: 'if', phase: 'unbind' },
            undefined
          );
        });
        uus.cleanups.delete(el);
      }

      // Ensure element is back in DOM if it was hidden
      uus.errorHandler.safe(
        () => {
          const comment = el.parentNode?.previousSibling;
          if (
            comment &&
            comment.nodeType === Node.COMMENT_NODE &&
            comment.textContent === 'uus-if'
          ) {
            comment.parentNode?.replaceChild(el, comment);
          }
        },
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'if', phase: 'cleanup-dom' },
        undefined
      );
    } catch (error) {
      uus.errorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'if', phase: 'unbind' }
      );
    }
  },
};
