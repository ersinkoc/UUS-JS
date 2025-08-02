import type { Directive, UusInstance } from '../types';
import { effect, createReactive } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import { walkElement, removeDirectiveAttribute } from '../parser';

interface ForLoopContext {
  items: any[];
  itemName: string;
  indexName?: string;
}

function parseForExpression(expression: string): ForLoopContext | null {
  // Parse expressions like "item in items" or "(item, index) in items"
  const match = expression.match(/^\s*(?:\(([^,)]+)(?:,\s*([^)]+))?\)|([^\s]+))\s+in\s+(.+)$/);
  
  if (!match) {
    console.error('Invalid for expression:', expression);
    return null;
  }

  const [, item1, index, item2, items] = match;
  const itemName = item1 || item2;
  
  if (!itemName || !items) {
    console.error('Invalid for expression:', expression);
    return null;
  }
  
  return {
    items: items.trim() as any,
    itemName: itemName.trim(),
    indexName: index?.trim()
  };
}

export const forDirective: Directive = {
  name: 'for',
  bind(el, binding, uus) {
    const parsed = parseForExpression(binding.expression || '');
    if (!parsed) return;

    const template = el.cloneNode(true) as HTMLElement;
    const comment = document.createComment(`uus-for: ${binding.expression}`);
    const parent = el.parentNode;
    
    if (!parent) {
      console.error('Element must have a parent for uus-for');
      return;
    }

    // Remove uus-for attribute from template to prevent infinite recursion
    removeDirectiveAttribute(template, 'for');
    
    // Remove the original element and insert comment as placeholder
    parent.replaceChild(comment, el);
    
    const instances: HTMLElement[] = [];
    const cleanupFns: Set<() => void> = new Set();
    
    const cleanup = effect(() => {
      try {
        // Clear existing instances
        instances.forEach(instance => {
          if (instance.parentNode) {
            instance.parentNode.removeChild(instance);
          }
        });
        cleanupFns.forEach(fn => fn());
        cleanupFns.clear();
        instances.length = 0;

        // Evaluate items expression
        const evaluator = createSafeEvaluator(uus.state);
        const items = evaluator(parsed.items as unknown as string);
        
        if (!Array.isArray(items)) {
          console.warn('uus-for expects an array, got:', items);
          return;
        }

        // Create instances for each item
        let lastNode: Node = comment;
        items.forEach((item, index) => {
          const instance = template.cloneNode(true) as HTMLElement;
          
          // Create scoped state for this iteration
          const scopedState = createReactive({
            ...uus.state,
            [parsed.itemName]: item,
            ...(parsed.indexName ? { [parsed.indexName]: index } : {})
          });

          // Create a scoped Uus instance for this iteration
          const scopedUus = {
            ...uus,
            state: scopedState
          };

          // Store scoped state on the instance
          (instance as any).__uusState = scopedState;
          
          // Process directives on the cloned element with the scoped instance
          walkElement(instance, (childEl, directive) => {
            const dir = uus.directives.get(directive.name);
            if (!dir) return;
            
            const binding = {
              value: directive.value,
              expression: directive.value,
              arg: directive.arg,
              modifiers: directive.modifiers || {}
            };
            
            if (directive.name === 'state' && dir.init) {
              // Skip state directive inside for loops
              return;
            }
            
            if (dir.init) {
              dir.init(childEl, binding, scopedUus);
            }
            if (dir.bind) {
              dir.bind(childEl, binding, scopedUus);
            }
          });

          // Insert after the last node
          parent.insertBefore(instance, lastNode.nextSibling);
          lastNode = instance as Node;
          instances.push(instance);
        });
      } catch (error) {
        console.error('Error in for directive:', error);
      }
    });

    // Store main cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(cleanup);
    cleanups.add(() => {
      cleanupFns.forEach(fn => fn());
      instances.forEach(instance => {
        if (instance.parentNode) {
          instance.parentNode.removeChild(instance);
        }
      });
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