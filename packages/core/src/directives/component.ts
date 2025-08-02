import type { Directive, UusInstance } from '../types';
import { createSafeEvaluator } from '../evaluator';
import { registerComponent, mountComponent } from '../lifecycle';
import { createReactive } from '../reactive';

export const componentDirective: Directive = {
  name: 'component',
  init(el, binding, uus) {
    try {
      const evaluator = createSafeEvaluator(uus.state);
      const componentDef = evaluator(binding.expression || '{}');
      
      if (typeof componentDef !== 'object' || componentDef === null) {
        console.error('uus-component must be an object');
        return;
      }
      
      // Create component state if defined
      if (componentDef.state) {
        const componentState = createReactive(componentDef.state);
        Object.assign(uus.state, componentState);
        (el as any).__uusState = componentState;
      }
      
      // Extract lifecycle hooks
      const hooks = {
        created: componentDef.created,
        mounted: componentDef.mounted,
        updated: componentDef.updated,
        destroyed: componentDef.destroyed
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
  }
};