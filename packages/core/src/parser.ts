import type { 
  DirectiveBinding, 
  DirectiveName, 
  ExpressionString,
  EventName,
  AttributeName 
} from './types';
import { 
  isDirectiveName, 
  isEventName, 
  isAttributeName,
  validateDirectiveNameFormat,
  asDirectiveName,
  asExpressionString,
  asEventName,
  asAttributeName
} from './type-guards';
import { 
  ParsingError, 
  ValidationError,
  ErrorCategory,
  globalErrorHandler,
  validate 
} from './errors';

const DIRECTIVE_PREFIX = 'uus-';
const EVENT_PREFIX = 'on:';
const BIND_PREFIX = 'bind:';

export interface ParsedDirective {
  name: DirectiveName;
  value: ExpressionString;
  arg?: EventName | AttributeName;
  modifiers: Record<string, boolean>;
}

export function parseDirective(attr: Attr, options?: { throwOnError?: boolean }): ParsedDirective | null {
  try {
    // Validate input
    validate('attr', attr, { 
      required: true,
      custom: (value) => {
        if (!value || typeof value !== 'object') return 'Attribute must be an object';
        if (!(value as any).name || typeof (value as any).name !== 'string') return 'Attribute must have a name property';
        if ((value as any).value !== undefined && typeof (value as any).value !== 'string') return 'Attribute value must be a string';
        return true;
      }
    });

    const name = attr.name;

    if (!name.startsWith(DIRECTIVE_PREFIX)) {
      return null;
    }

    const directivePart = name.slice(DIRECTIVE_PREFIX.length);
    
    // Validate directive part
    if (!directivePart) {
      const error = new ParsingError(
        null as any, // Element not available in this context
        name,
        new Error('Directive name cannot be empty'),
        { directivePart, attributeName: name }
      );
      
      if (options?.throwOnError) {
        throw error;
      }
      
      globalErrorHandler.handle(error);
      return null;
    }

    let directiveName: DirectiveName;
    let arg: EventName | AttributeName | undefined;
    let modifiers: Record<string, boolean> = {};

    try {
      // Handle special directives with arguments
      if (directivePart.startsWith(EVENT_PREFIX)) {
        directiveName = asDirectiveName('on');
        const eventPart = directivePart.slice(EVENT_PREFIX.length);
        
        if (!eventPart) {
          throw new Error('Event name cannot be empty');
        }
        
        const [eventName, ...modifierParts] = eventPart.split('.');
        
        // Validate event name
        if (!eventName || !eventName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
          throw new Error('Invalid event name format');
        }
        
        arg = asEventName(eventName);
        modifiers = modifierParts.reduce(
          (acc, mod) => {
            if (mod !== undefined) { // Include empty modifiers
              if (mod === '' || mod.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
                acc[mod] = true;
              }
            }
            return acc;
          },
          {} as Record<string, boolean>
        );
      } else if (directivePart.startsWith(BIND_PREFIX)) {
        directiveName = asDirectiveName('bind');
        const bindPart = directivePart.slice(BIND_PREFIX.length);
        
        if (!bindPart) {
          throw new Error('Bind attribute name cannot be empty');
        }
        
        // Validate bind attribute name
        if (!bindPart.match(/^[a-zA-Z][a-zA-Z0-9-]*$/)) {
          throw new Error('Invalid bind attribute name format');
        }
        
        arg = asAttributeName(bindPart);
      } else {
        // Regular directive, might have modifiers
        const [name, ...modifierParts] = directivePart.split('.');
        directiveName = asDirectiveName(name || directivePart);
        
        // Validate directive name
        if (!directiveName.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
          throw new Error('Invalid directive name format');
        }
        
        modifiers = modifierParts.reduce(
          (acc, mod) => {
            if (mod !== undefined) { // Include empty modifiers
              if (mod === '' || mod.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
                acc[mod] = true;
              }
            }
            return acc;
          },
          {} as Record<string, boolean>
        );
      }

      // Validate attribute value length
      if (attr.value && attr.value.length > 5000) {
        throw new Error('Directive value too long (max 5000 characters)');
      }

      return {
        name: directiveName,
        value: asExpressionString(attr.value || ''),
        arg,
        modifiers,
      };

    } catch (error) {
      throw new ParsingError(
        null as any, // Element not available in this context
        name,
        error instanceof Error ? error : new Error(String(error)),
        { 
          directivePart, 
          attributeName: name,
          attributeValue: attr.value 
        }
      );
    }

  } catch (error) {
    // If we're in test mode and should throw errors, re-throw them
    if (options?.throwOnError && error instanceof ParsingError) {
      throw error;
    }
    
    if (error instanceof ParsingError || error instanceof ValidationError) {
      globalErrorHandler.handle(error);
    } else {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PARSING,
        { attributeName: attr?.name, attributeValue: attr?.value }
      );
    }
    
    // Return null for invalid directives to skip them gracefully
    return null;
  }
}

export function createBinding(parsed: ParsedDirective): DirectiveBinding {
  try {
    // Validate input
    validate('parsed', parsed, {
      required: true,
      custom: (value) => {
        if (!value || typeof value !== 'object') return 'Parsed directive must be an object';
        if (typeof (value as any).name !== 'string') return 'Directive name must be a string';
        if ((value as any).value !== undefined && typeof (value as any).value !== 'string') return 'Directive value must be a string';
        if ((value as any).modifiers && typeof (value as any).modifiers !== 'object') return 'Modifiers must be an object';
        return true;
      }
    });

    // Create binding matching expected test structure
    const binding: DirectiveBinding = {
      value: parsed.value || '', // Use the expression value directly for tests
      expression: asExpressionString(parsed.value || ''),
      modifiers: parsed.modifiers || {},
    };

    // Add arg if present
    if (parsed.arg) {
      (binding as any).arg = parsed.arg;
    }

    return binding;

  } catch (error) {
    if (error instanceof ValidationError) {
      globalErrorHandler.handle(error);
    } else {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PARSING,
        { parsed }
      );
    }

    // Return safe fallback binding
    return {
      value: '',
      arg: undefined,
      modifiers: {},
      expression: asExpressionString(''),
    };
  }
}

export function walkElement(
  el: HTMLElement,
  callback: (el: HTMLElement, directive: ParsedDirective) => void,
  options?: { skipChildren?: boolean }
): void {
  try {
    // Validate inputs
    validate('el', el, {
      required: true,
      custom: (value) => {
        if (!(value instanceof HTMLElement)) return 'Element must be an HTMLElement';
        return true;
      }
    });

    validate('callback', callback, {
      required: true,
      type: 'function'
    });

    // Process attributes with error handling
    const attributes = Array.from(el.attributes);
    let skipChildren = options?.skipChildren || false;

    // Parse all directives first
    const parsedDirectives: ParsedDirective[] = [];
    for (const attr of attributes) {
      try {
        const parsed = parseDirective(attr);
        if (parsed) {
          parsedDirectives.push(parsed);
        }
      } catch (error) {
        globalErrorHandler.handleGenericError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorCategory.PARSING,
          { 
            element: el,
            attributeName: attr.name,
            attributeValue: attr.value,
            phase: 'directive-parsing' 
          }
        );
        // Continue processing other attributes
      }
    }

    // Sort directives by priority - structural directives first
    const structuralDirectives = parsedDirectives.filter(d => d.name === 'for' || d.name === 'if');
    const otherDirectives = parsedDirectives.filter(d => d.name !== 'for' && d.name !== 'if');
    
    // If there are structural directives, only process them and skip other directives
    // The structural directives will handle other directives on the same element
    const directivesToProcess = structuralDirectives.length > 0 ? structuralDirectives : parsedDirectives;

    // Process directives in priority order
    for (const parsed of directivesToProcess) {
      try {
        // Safely execute callback
        globalErrorHandler.safe(
          () => callback(el, parsed),
          ErrorCategory.PARSING,
          { 
            element: el,
            directive: parsed.name,
            attributeName: `uus-${parsed.name}`,
            attributeValue: parsed.value 
          },
          undefined
        );

        // Don't walk children of elements with structural directives
        if (parsed.name === 'for' || parsed.name === 'if') {
          skipChildren = true;
        }
      } catch (error) {
        globalErrorHandler.handleGenericError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorCategory.PARSING,
          { 
            element: el,
            directive: parsed.name,
            attributeValue: parsed.value,
            phase: 'directive-processing' 
          }
        );
        // Continue processing other directives
      }
    }

    // Process children unless skipped, with error handling
    if (!skipChildren) {
      try {
        const children = Array.from(el.children);
        for (const child of children) {
          if (child instanceof HTMLElement) {
            // Recursively walk children with error boundaries
            globalErrorHandler.safe(
              () => walkElement(child, callback, options),
              ErrorCategory.PARSING,
              { 
                element: el,
                childElement: child,
                phase: 'child-processing' 
              },
              undefined
            );
          }
        }
      } catch (error) {
        globalErrorHandler.handleGenericError(
          error instanceof Error ? error : new Error(String(error)),
          ErrorCategory.PARSING,
          { element: el, phase: 'children-iteration' }
        );
      }
    }

  } catch (error) {
    if (error instanceof ValidationError) {
      globalErrorHandler.handle(error);
    } else {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PARSING,
        { element: el, phase: 'walk-element' }
      );
    }
  }
}

export function removeDirectiveAttribute(
  el: HTMLElement,
  directiveName: string
): void {
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const parsed = parseDirective(attr); // No need for throwOnError in this utility function
    if (parsed && parsed.name === directiveName) {
      el.removeAttribute(attr.name);
      break;
    }
  }
}

export function getElementState(
  el: HTMLElement
): Record<string, unknown> | null {
  let current = el;
  while (current) {
    if (
      (current as HTMLElement & { __uusState?: Record<string, unknown> })
        .__uusState
    ) {
      return (current as HTMLElement & { __uusState: Record<string, unknown> })
        .__uusState;
    }
    current = current.parentElement as HTMLElement;
  }
  return null;
}
