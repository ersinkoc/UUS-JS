import type { Directive, BindDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import {
  asDirectiveName,
  asExpressionString,
  isBindDirectiveBinding,
} from '../type-guards';

export const bindDirective: Directive<BindDirectiveBinding> = {
  name: asDirectiveName('bind'),
  bind(el, binding, uus) {
    if (!binding.arg) {
      console.error('Attribute name required for uus-bind');
      return;
    }

    if (!isBindDirectiveBinding(binding)) {
      console.error('Invalid binding for bind directive');
      return;
    }

    const attrName = binding.arg;
    const evaluator = createSafeEvaluator(uus.state);

    const cleanup = effect(() => {
      try {
        const value = evaluator(
          binding.expression
            ? asExpressionString(binding.expression)
            : asExpressionString('')
        );

        // Special handling for certain attributes
        if (attrName === 'class') {
          if (typeof value === 'object' && value !== null) {
            // Object syntax: { 'class-name': condition }
            Object.entries(value).forEach(([className, condition]) => {
              if (condition) {
                el.classList.add(className);
              } else {
                el.classList.remove(className);
              }
            });
          } else {
            // String syntax
            el.className = String(value ?? '');
          }
        } else if (attrName === 'style') {
          if (typeof value === 'object' && value !== null) {
            // Object syntax: { color: 'red', fontSize: '14px' }
            Object.entries(value).forEach(([prop, val]) => {
              (el.style as unknown as Record<string, string>)[prop] = String(
                val ?? ''
              );
            });
          } else {
            // String syntax
            el.setAttribute('style', String(value ?? ''));
          }
        } else if (value === false || value === null || value === undefined) {
          // Remove attribute for falsy values
          el.removeAttribute(attrName);
        } else {
          // Set attribute value
          el.setAttribute(attrName, String(value));
        }
      } catch (error) {
        console.error(`Error binding attribute ${attrName}:`, error);
      }
    });

    // Store cleanup function
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
