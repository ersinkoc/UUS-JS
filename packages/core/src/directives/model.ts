import type { Directive, GenericDirectiveBinding } from '../types';
import { effect } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { asDirectiveName, asExpressionString } from '../type-guards';

export const modelDirective: Directive<GenericDirectiveBinding> = {
  name: asDirectiveName('model'),
  bind(el, binding, uus) {
    if (
      !(
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      )
    ) {
      console.error(
        'uus-model can only be used on input, textarea, or select elements'
      );
      return;
    }

    const evaluator = createSafeEvaluator(uus.state);

    // Update element value when state changes
    const cleanup = effect(() => {
      try {
        const value = evaluator(
          binding.expression
            ? asExpressionString(binding.expression)
            : asExpressionString('')
        );
        if (
          el instanceof HTMLInputElement &&
          (el.type === 'checkbox' || el.type === 'radio')
        ) {
          el.checked = !!value;
        } else {
          el.value = String(value ?? '');
        }
      } catch (error) {
        console.error('Error updating model value:', error);
      }
    });

    // Update state when element value changes
    const updateState = () => {
      try {
        let value: unknown;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          value = el.checked;
        } else if (el instanceof HTMLInputElement && el.type === 'number') {
          value = el.valueAsNumber;
        } else {
          value = el.value;
        }

        // Parse the expression to get the property path
        const propPath = binding.expression?.trim();
        if (!propPath) return;

        // Simple property assignment (doesn't handle nested paths yet)
        const parts = propPath.split('.');
        let target: Record<string, unknown> = uus.state as Record<
          string,
          unknown
        >;

        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          if (!key) return;
          const nextTarget = target[key];
          if (!nextTarget || typeof nextTarget !== 'object') return;
          target = nextTarget as Record<string, unknown>;
        }

        const lastKey = parts[parts.length - 1];
        if (lastKey) {
          target[lastKey] = value;
        }
      } catch (error) {
        console.error('Error updating state from model:', error);
      }
    };

    // Listen for input events
    const eventType = el instanceof HTMLSelectElement ? 'change' : 'input';
    el.addEventListener(eventType, updateState);
    // Note: For select elements, only 'change' is needed (already handled above)
    // For input elements, only 'input' is needed for real-time updates
    if (el instanceof HTMLInputElement && el.type !== 'checkbox' && el.type !== 'radio') {
      // Add change event for additional validation triggers
      el.addEventListener('change', updateState);
    }

    // Store cleanup functions
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    cleanups.add(() => {
      el.removeEventListener(eventType, updateState);
      // Only remove change listener if it was added
      if (el instanceof HTMLInputElement && el.type !== 'checkbox' && el.type !== 'radio') {
        el.removeEventListener('change', updateState);
      }
    });
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
