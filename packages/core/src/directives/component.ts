import type { Directive, GenericDirectiveBinding } from '../types';
import { createSafeEvaluator } from '../evaluator';
import { registerComponent, mountComponent } from '../lifecycle';
import { createReactive } from '../reactive';
import { asDirectiveName, asExpressionString } from '../type-guards';

interface ComponentDefinition {
  state?: Record<string, unknown>;
  created?: () => void;
  mounted?: () => void;
  updated?: () => void;
  destroyed?: () => void;
  [key: string]: unknown;
}

function isComponentDefinition(obj: unknown): obj is ComponentDefinition {
  return typeof obj === 'object' && obj !== null;
}

export const componentDirective: Directive<GenericDirectiveBinding> = {
  name: asDirectiveName('component'),
  init(el, binding, uus) {
    try {
      const evaluator = createSafeEvaluator(uus.state);
      const componentDef = evaluator(binding.expression ? asExpressionString(binding.expression) : asExpressionString('{}'));

      if (!isComponentDefinition(componentDef)) {
        console.error('uus-component must be an object');
        return;
      }

      // Create component state if defined
      if (componentDef.state && typeof componentDef.state === 'object') {
        const componentState = createReactive(componentDef.state);
        Object.assign(uus.state, componentState);
        (
          el as HTMLElement & { __uusState?: Record<string, unknown> }
        ).__uusState = componentState;
      }

      // Extract lifecycle hooks
      const hooks = {
        created:
          typeof componentDef.created === 'function'
            ? componentDef.created
            : undefined,
        mounted:
          typeof componentDef.mounted === 'function'
            ? componentDef.mounted
            : undefined,
        updated:
          typeof componentDef.updated === 'function'
            ? componentDef.updated
            : undefined,
        destroyed:
          typeof componentDef.destroyed === 'function'
            ? componentDef.destroyed
            : undefined,
      };

      // Register component
      registerComponent(el, hooks);

      // Mount will be called after DOM is ready
      requestAnimationFrame(() => {
        mountComponent(el);
      });
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  },
};
