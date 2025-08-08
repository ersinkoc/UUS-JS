import type {
  Directive,
  LoopDirectiveBinding,
  UusInstance,
  ReactiveState,
} from '../types';
import { effect, createReactive } from '../reactive';
import { createSafeEvaluator } from '../evaluator';
import {
  walkElement,
  removeDirectiveAttribute,
  parseDirective,
  createBinding,
} from '../parser';
import { DirectiveError, ErrorCategory, validate } from '../errors';
import { asDirectiveName, asExpressionString } from '../type-guards';

interface ForLoopContext {
  items: string; // Expression string, will be evaluated later
  itemName: string;
  indexName?: string;
}

function parseForExpression(expression: string): ForLoopContext | null {
  try {
    // Validate input
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression must be a non-empty string');
    }

    // Parse expressions like "item in items" or "(item, index) in items"
    const match = expression.match(
      /^\s*(?:\(([^,)]+)(?:,\s*([^)]+))?\)|([^\s]+))\s+in\s+(.+)$/
    );

    if (!match) {
      throw new Error(
        `Invalid for expression syntax: "${expression}". Expected format: "item in items" or "(item, index) in items"`
      );
    }

    const [, item1, index, item2, items] = match;
    const itemName = item1 || item2;

    if (!itemName || !items) {
      throw new Error('Missing item name or items expression');
    }

    // Validate variable names
    const trimmedItemName = itemName.trim();
    const trimmedIndexName = index?.trim();
    const trimmedItems = items.trim();

    if (!trimmedItemName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
      throw new Error(`Invalid item variable name: "${trimmedItemName}"`);
    }

    if (
      trimmedIndexName &&
      !trimmedIndexName.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)
    ) {
      throw new Error(`Invalid index variable name: "${trimmedIndexName}"`);
    }

    if (!trimmedItems) {
      throw new Error('Items expression cannot be empty');
    }

    return {
      items: trimmedItems,
      itemName: trimmedItemName,
      indexName: trimmedIndexName,
    };
  } catch (error) {
    return null; // Return null on parsing error, let the directive handle it
  }
}

export const forDirective: Directive<LoopDirectiveBinding> = {
  name: asDirectiveName('for'),
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
          'for',
          'bind',
          new Error('Element must have a parent for uus-for directive'),
          { element: el }
        );
      }

      const parsed = parseForExpression(binding.expression || '');
      if (!parsed) {
        throw new DirectiveError(
          'for',
          'bind',
          new Error('Invalid for expression'),
          { element: el, expression: binding.expression }
        );
      }

      const template = uus.errorHandler.safe(
        () => el.cloneNode(true) as HTMLElement,
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'for', phase: 'template-clone' }
      );

      if (!template) {
        throw new DirectiveError(
          'for',
          'bind',
          new Error('Failed to clone template element'),
          { element: el }
        );
      }

      const comment = document.createComment(`uus-for: ${binding.expression}`);
      const parent = el.parentNode;

      // Extract other directives from the original element before removing it
      const originalDirectives: Array<{
        name: string;
        value: string;
        parsed: any;
      }> = [];

      const originalAttributes = Array.from(el.attributes);
      for (const attr of originalAttributes) {
        if (attr.name.startsWith('uus-') && attr.name !== 'uus-for') {
          const parsed = uus.errorHandler.safe(
            () => parseDirective(attr),
            ErrorCategory.DIRECTIVE,
            {
              element: el,
              directive: 'for',
              phase: 'parse-sibling-directive',
              attributeName: attr.name,
            }
          );

          if (parsed) {
            originalDirectives.push({
              name: attr.name,
              value: attr.value,
              parsed,
            });
          }
        }
      }

      // Remove uus-for attribute from template to prevent infinite recursion
      uus.errorHandler.safe(
        () => removeDirectiveAttribute(template, 'for'),
        ErrorCategory.DIRECTIVE,
        { element: template, directive: 'for', phase: 'cleanup-template' },
        undefined
      );

      // Remove other directives from template since we'll apply them manually with scoped state
      originalDirectives.forEach(({ name }) => {
        uus.errorHandler.safe(
          () => template.removeAttribute(name),
          ErrorCategory.DIRECTIVE,
          {
            element: template,
            directive: 'for',
            phase: 'cleanup-template-directives',
            attributeName: name,
          },
          undefined
        );
      });

      // Remove the original element and insert comment as placeholder
      uus.errorHandler.safe(
        () => parent.replaceChild(comment, el),
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'for', phase: 'dom-replacement' },
        undefined
      );

      const instances: HTMLElement[] = [];
      const cleanupFns: Set<() => void> = new Set();
      const instanceResources: string[] = []; // Track resource IDs

      const cleanup = effect(() => {
        const context = {
          element: el,
          directive: 'for',
          expression: binding.expression,
          parsed,
        };

        // Safely clear existing instances
        uus.errorHandler.safe(
          () => {
            instances.forEach((instance) => {
              if (instance.parentNode) {
                instance.parentNode.removeChild(instance);
              }
            });
            cleanupFns.forEach((fn) => {
              try {
                fn();
              } catch (error) {
                console.warn('Error in for directive cleanup:', error);
              }
            });
            cleanupFns.clear();
            instances.length = 0;

            // Cleanup tracked resources
            if ((uus as any).memoryTracker) {
              instanceResources.forEach((resourceId) => {
                (uus as any).memoryTracker.untrack(resourceId);
              });
            }
            instanceResources.length = 0;
          },
          ErrorCategory.DIRECTIVE,
          { ...context, phase: 'cleanup-instances' },
          undefined
        );

        // Safely evaluate items expression
        const evaluator = createSafeEvaluator(uus.state);
        const items = uus.errorHandler.safe(
          () => evaluator(asExpressionString(parsed.items)),
          ErrorCategory.EVALUATION,
          { ...context, itemsExpression: parsed.items },
          [] // Default to empty array on evaluation error
        );

        if (!Array.isArray(items)) {
          uus.errorHandler.handleGenericError(
            new Error(`uus-for expects an array, got: ${typeof items}`),
            ErrorCategory.DIRECTIVE,
            { ...context, itemsValue: items, itemsType: typeof items }
          );
          return;
        }

        // Create instances for each item with error boundaries
        let lastNode: Node = comment;
        items.forEach((item, index) => {
          uus.errorHandler.safe(
            () => {
              const instance = template.cloneNode(true) as HTMLElement;

              // Create scoped state for this iteration
              const scopedState = createReactive({
                ...uus.state,
                [parsed.itemName]: item,
                ...(parsed.indexName ? { [parsed.indexName]: index } : {}),
              });

              // Create a scoped Uus instance for this iteration
              const scopedUus: UusInstance = {
                ...uus,
                state: scopedState as ReactiveState,
              };

              // Store scoped state on the instance
              (
                instance as HTMLElement & {
                  __uusState?: Record<string, unknown>;
                }
              ).__uusState = scopedState;

              // Apply original directives from the template element to this instance with scoped state
              originalDirectives.forEach(
                ({ name, parsed: directiveParsed }) => {
                  uus.errorHandler.safe(
                    () => {
                      const dir = uus.directives.get(directiveParsed.name);
                      if (!dir) return;

                      const directiveBinding = createBinding(directiveParsed);

                      // Add the directive attribute back to the instance for proper processing
                      instance.setAttribute(name, directiveParsed.value);

                      if (dir.init) {
                        dir.init(instance, directiveBinding, scopedUus);
                      }
                      if (dir.bind) {
                        dir.bind(instance, directiveBinding, scopedUus);
                      }
                    },
                    ErrorCategory.DIRECTIVE,
                    {
                      parentElement: el,
                      instance: instance,
                      directive: directiveParsed.name,
                      itemIndex: index,
                      phase: 'apply-original-directive',
                    },
                    undefined
                  );
                }
              );

              // Track instance with memory manager
              if ((uus as any).memoryTracker) {
                const resourceId = (uus as any).memoryTracker.track(
                  'component',
                  instance,
                  () => {
                    if (instance.parentNode) {
                      instance.parentNode.removeChild(instance);
                    }
                  },
                  {
                    type: 'for-instance',
                    itemIndex: index,
                    parentExpression: binding.expression,
                  }
                );
                instanceResources.push(resourceId);
              }

              // Process directives on the cloned element with error boundaries
              walkElement(instance, (childEl, directive) => {
                uus.errorHandler.safe(
                  () => {
                    const dir = uus.directives.get(directive.name);
                    if (!dir) return;

                    const childBinding = {
                      value: directive.value,
                      expression: directive.value,
                      arg: directive.arg,
                      modifiers: directive.modifiers || {},
                    };

                    if (directive.name === 'state' && dir.init) {
                      // Skip state directive inside for loops
                      return;
                    }

                    if (dir.init) {
                      dir.init(childEl, childBinding, scopedUus);
                    }
                    if (dir.bind) {
                      dir.bind(childEl, childBinding, scopedUus);
                    }
                  },
                  ErrorCategory.DIRECTIVE,
                  {
                    parentElement: el,
                    childElement: childEl,
                    directive: directive.name,
                    itemIndex: index,
                    phase: 'child-directive-binding',
                  },
                  undefined
                );
              });

              // Insert after the last node
              parent.insertBefore(instance, lastNode.nextSibling);
              lastNode = instance as Node;
              instances.push(instance);
            },
            ErrorCategory.DIRECTIVE,
            {
              ...context,
              phase: 'instance-creation',
              itemIndex: index,
              item: typeof item,
            },
            undefined
          );
        });
      });

      // Store main cleanup
      const cleanups = uus.cleanups.get(el) || new Set();
      cleanups.add(cleanup);
      cleanups.add(() => {
        uus.errorHandler.safe(
          () => {
            cleanupFns.forEach((fn) => {
              try {
                fn();
              } catch (error) {
                console.warn('Error in for directive final cleanup:', error);
              }
            });
            instances.forEach((instance) => {
              if (instance.parentNode) {
                instance.parentNode.removeChild(instance);
              }
            });

            // Final cleanup of tracked resources
            if ((uus as any).memoryTracker) {
              instanceResources.forEach((resourceId) => {
                (uus as any).memoryTracker.untrack(resourceId);
              });
            }
          },
          ErrorCategory.DIRECTIVE,
          { element: el, directive: 'for', phase: 'final-cleanup' },
          undefined
        );
      });
      uus.cleanups.set(el, cleanups);
    } catch (error) {
      const directiveError =
        error instanceof DirectiveError
          ? error
          : new DirectiveError(
              'for',
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
            { element: el, directive: 'for', phase: 'unbind' },
            undefined
          );
        });
        uus.cleanups.delete(el);
      }
    } catch (error) {
      uus.errorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.DIRECTIVE,
        { element: el, directive: 'for', phase: 'unbind' }
      );
    }
  },
};
