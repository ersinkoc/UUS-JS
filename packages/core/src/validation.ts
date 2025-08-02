/**
 * Validation helpers for critical paths in UUS.js
 * 
 * Provides runtime validation for common scenarios to prevent errors
 * and improve developer experience with clear error messages.
 */

import { ValidationError, validate } from './errors';

/**
 * Validates that an element is a valid HTMLElement for UUS directives
 */
export function validateElement(element: unknown, context?: string): HTMLElement {
  validate('element', element, {
    required: true,
    custom: (value) => {
      if (!(value instanceof HTMLElement)) {
        return `Expected HTMLElement${context ? ` for ${context}` : ''}, got ${typeof value}`;
      }
      return true;
    }
  });
  return element as HTMLElement;
}

/**
 * Validates that a directive expression is safe and reasonable
 */
export function validateDirectiveExpression(expression: unknown, directiveName?: string): string {
  validate('expression', expression, {
    type: 'string',
    maxLength: 5000,
    custom: (value) => {
      if (typeof value === 'string') {
        // Check for common security issues
        const dangerousPatterns = [
          /\beval\s*\(/,
          /\bFunction\s*\(/,
          /\b__proto__\b/,
          /\bconstructor\b.*\bprototype\b/,
          /\bdocument\s*\.\s*write\b/,
          /\bsetTimeout\s*\(/,
          /\bsetInterval\s*\(/,
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(value)) {
            return `Potentially unsafe expression detected${directiveName ? ` in ${directiveName} directive` : ''}`;
          }
        }

        // Check for reasonable complexity
        const complexityIndicators = [
          (value.match(/\(/g) || []).length > 10, // Too many function calls
          (value.match(/\[/g) || []).length > 5,  // Too many array accesses
          value.length > 1000,                     // Too long
        ];

        if (complexityIndicators.some(Boolean)) {
          return `Expression may be too complex${directiveName ? ` for ${directiveName} directive` : ''}`;
        }
      }
      return true;
    }
  });
  return expression as string;
}

/**
 * Validates directive binding objects
 */
export function validateDirectiveBinding(binding: unknown, directiveName?: string): {
  value: string;
  expression: string;
  arg?: string;
  modifiers: Record<string, boolean>;
} {
  validate('binding', binding, {
    required: true,
    type: 'object',
    custom: (value) => {
      if (!value || typeof value !== 'object') {
        return `Invalid binding object${directiveName ? ` for ${directiveName} directive` : ''}`;
      }

      const b = value as any;
      if (b.value !== undefined && typeof b.value !== 'string') {
        return 'Binding value must be a string';
      }

      if (b.expression !== undefined && typeof b.expression !== 'string') {
        return 'Binding expression must be a string';
      }

      if (b.arg !== undefined && typeof b.arg !== 'string') {
        return 'Binding arg must be a string';
      }

      if (b.modifiers !== undefined && (typeof b.modifiers !== 'object' || Array.isArray(b.modifiers))) {
        return 'Binding modifiers must be an object';
      }

      return true;
    }
  });

  const b = binding as any;
  return {
    value: b.value || '',
    expression: b.expression || b.value || '',
    arg: b.arg,
    modifiers: b.modifiers || {},
  };
}

/**
 * Validates UUS instance objects
 */
export function validateUusInstance(uus: unknown, context?: string): any {
  validate('uus', uus, {
    required: true,
    type: 'object',
    custom: (value) => {
      if (!value || typeof value !== 'object') {
        return `Invalid UUS instance${context ? ` for ${context}` : ''}`;
      }

      const u = value as any;
      
      // Check required properties
      const requiredProps = ['state', 'directives', 'cleanups', 'errorHandler'];
      for (const prop of requiredProps) {
        if (!(prop in u)) {
          return `UUS instance missing required property: ${prop}`;
        }
      }

      // Validate property types
      if (typeof u.state !== 'object') {
        return 'UUS state must be an object';
      }

      if (!u.directives || typeof u.directives.get !== 'function') {
        return 'UUS directives must be a Map';
      }

      if (!u.cleanups || typeof u.cleanups.get !== 'function') {
        return 'UUS cleanups must be a WeakMap';
      }

      if (!u.errorHandler || typeof u.errorHandler.handle !== 'function') {
        return 'UUS errorHandler must have a handle method';
      }

      return true;
    }
  });

  return uus;
}

/**
 * Validates event handler expressions
 */
export function validateEventHandler(handler: unknown, eventName?: string): string {
  validate('handler', handler, {
    required: true,
    type: 'string',
    maxLength: 500,
    custom: (value) => {
      if (typeof value === 'string') {
        // Must be a valid function call or function name
        const validPatterns = [
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/, // Simple function name
          /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(.*\)$/, // Function call
        ];

        if (!validPatterns.some(pattern => pattern.test(value.trim()))) {
          return `Invalid event handler format${eventName ? ` for ${eventName} event` : ''}`;
        }

        // Check for dangerous patterns
        if (/\beval\b|\bFunction\b|\b__proto__\b/.test(value)) {
          return `Unsafe event handler expression${eventName ? ` for ${eventName} event` : ''}`;
        }
      }
      return true;
    }
  });

  return handler as string;
}

/**
 * Validates CSS class binding values
 */
export function validateClassBinding(classes: unknown): string | Record<string, boolean> | Array<string> {
  // Allow string, object, or array
  if (typeof classes === 'string') {
    validate('classes', classes, {
      maxLength: 1000,
      custom: (value) => {
        // Basic CSS class name validation
        const classNames = (value as string).split(/\s+/).filter(Boolean);
        for (const className of classNames) {
          if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(className)) {
            return `Invalid CSS class name: ${className}`;
          }
        }
        return true;
      }
    });
    return classes;
  }

  if (Array.isArray(classes)) {
    validate('classes', classes, {
      custom: (value) => {
        const arr = value as unknown[];
        if (arr.length > 100) {
          return 'Too many class names (max 100)';
        }
        for (const item of arr) {
          if (typeof item !== 'string') {
            return 'Array class bindings must contain only strings';
          }
          if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(item)) {
            return `Invalid CSS class name: ${item}`;
          }
        }
        return true;
      }
    });
    return classes;
  }

  if (typeof classes === 'object' && classes !== null) {
    validate('classes', classes, {
      custom: (value) => {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length > 100) {
          return 'Too many class bindings (max 100)';
        }
        for (const key of keys) {
          if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(key)) {
            return `Invalid CSS class name: ${key}`;
          }
        }
        return true;
      }
    });
    return classes as Record<string, boolean>;
  }

  throw new ValidationError(
    'classes',
    classes,
    'Class binding must be a string, array, or object',
    { value: typeof classes }
  );
}

/**
 * Validates style binding values
 */
export function validateStyleBinding(styles: unknown): string | Record<string, string> {
  if (typeof styles === 'string') {
    validate('styles', styles, {
      maxLength: 2000,
      custom: (value) => {
        // Basic CSS validation - check for dangerous content
        const dangerousPatterns = [
          /javascript:/i,
          /expression\s*\(/i,
          /url\s*\(\s*["']?javascript:/i,
          /@import/i,
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(value as string)) {
            return 'Potentially unsafe CSS detected';
          }
        }
        return true;
      }
    });
    return styles;
  }

  if (typeof styles === 'object' && styles !== null) {
    validate('styles', styles, {
      custom: (value) => {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        if (keys.length > 50) {
          return 'Too many style properties (max 50)';
        }
        
        for (const [key, val] of Object.entries(obj)) {
          // Validate CSS property names (basic check)
          if (!/^[a-zA-Z-]+$/.test(key)) {
            return `Invalid CSS property name: ${key}`;
          }
          
          // Validate CSS values
          if (typeof val === 'string') {
            const dangerousPatterns = [
              /javascript:/i,
              /expression\s*\(/i,
              /url\s*\(\s*["']?javascript:/i,
            ];

            for (const pattern of dangerousPatterns) {
              if (pattern.test(val)) {
                return `Potentially unsafe CSS value for property ${key}`;
              }
            }
          }
        }
        return true;
      }
    });
    return styles as Record<string, string>;
  }

  throw new ValidationError(
    'styles',
    styles,
    'Style binding must be a string or object',
    { value: typeof styles }
  );
}

/**
 * Validates loop iteration data for v-for directive
 */
export function validateLoopData(items: unknown, expression?: string): unknown[] {
  validate('items', items, {
    custom: (value) => {
      if (!Array.isArray(value)) {
        return `Loop items must be an array${expression ? ` in expression: ${expression}` : ''}, got ${typeof value}`;
      }

      if (value.length > 10000) {
        return 'Too many items to loop over (max 10000 for performance)';
      }

      return true;
    }
  });

  return items as unknown[];
}