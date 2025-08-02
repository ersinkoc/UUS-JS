/**
 * Validation Utilities - Optional for production builds
 * Provides comprehensive validation in development, minimal in production
 */

export * from '../validation';

// Slim validation functions for production
export function validateElementSlim(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function validateDirectiveExpressionSlim(expression: string): boolean {
  return typeof expression === 'string' && expression.length > 0;
}

// Environment-aware validation loader
export function getValidator(name: string) {
  if (process.env.NODE_ENV === 'production') {
    // Return minimal validators in production
    switch (name) {
      case 'element':
        return validateElementSlim;
      case 'expression':
        return validateDirectiveExpressionSlim;
      default:
        return () => true; // No-op validator
    }
  } else {
    // Load full validation in development
    return import('../validation').then(validators => {
      switch (name) {
        case 'element':
          return validators.validateElement;
        case 'expression':
          return validators.validateDirectiveExpression;
        default:
          return () => true;
      }
    });
  }
}

// Conditional validation helper
export function withValidation<T extends (...args: any[]) => any>(
  fn: T,
  validator?: (args: Parameters<T>) => void
): T {
  if (process.env.NODE_ENV === 'production' || !validator) {
    return fn;
  }
  
  return ((...args: Parameters<T>) => {
    validator(args);
    return fn(...args);
  }) as T;
}