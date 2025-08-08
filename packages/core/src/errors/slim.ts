/**
 * Slim Error Handling for Production
 * Provides minimal error handling overhead for production builds
 */

export enum ErrorCategory {
  EVALUATION = 'evaluation',
  DIRECTIVE = 'directive',
  REACTIVE = 'reactive',
  PARSING = 'parsing',
  MOUNTING = 'mounting',
  VALIDATION = 'validation',
  LIFECYCLE = 'lifecycle',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Minimal error classes for production
export class UusError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory
  ) {
    super(message);
    this.name = 'UusError';
  }
}

export class DirectiveError extends UusError {
  constructor(directive: string, operation: string, originalError: Error) {
    super(
      `Directive error in ${directive}.${operation}: ${originalError.message}`,
      ErrorCategory.DIRECTIVE
    );
  }
}

export class MountingError extends UusError {
  constructor(target: unknown, originalError: Error) {
    super(`Mounting error: ${originalError.message}`, ErrorCategory.MOUNTING);
  }
}

export class ReactiveError extends UusError {
  constructor(operation: string, originalError: Error) {
    super(
      `Reactive error in ${operation}: ${originalError.message}`,
      ErrorCategory.REACTIVE
    );
  }
}

export class EvaluationError extends UusError {
  constructor(expression: string, originalError: Error) {
    super(
      `Evaluation error in "${expression}": ${originalError.message}`,
      ErrorCategory.EVALUATION
    );
  }
}

export class ParsingError extends UusError {
  constructor(element: HTMLElement, originalError: Error) {
    super(`Parsing error: ${originalError.message}`, ErrorCategory.PARSING);
  }
}

export class ValidationError extends UusError {
  constructor(field: string, originalError: Error) {
    super(
      `Validation error in ${field}: ${originalError.message}`,
      ErrorCategory.VALIDATION
    );
  }
}

// Minimal error handler for production
export class SlimErrorHandler {
  safe<T>(fn: () => T, category: ErrorCategory, fallback?: T): T | undefined {
    try {
      return fn();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[UUS ${category}]:`, error);
      }
      return fallback;
    }
  }

  handle(error: UusError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[UUS ${error.category}]:`, error.message, error);
    }
    // In production, fail silently unless critical
    if (error.category === ErrorCategory.MOUNTING) {
      throw error; // Critical errors should still throw
    }
  }
}

// Global slim error handler
export const slimErrorHandler = new SlimErrorHandler();

// Minimal validation
export function validate(
  name: string,
  value: unknown,
  options: { required?: boolean; type?: string }
): void {
  if (process.env.NODE_ENV === 'development') {
    if (options.required && (value === null || value === undefined)) {
      throw new Error(`${name} is required`);
    }
    if (options.type && typeof value !== options.type) {
      throw new Error(`${name} must be of type ${options.type}`);
    }
  }
}

// No-op functions for production
export const createSafeFunction = <T extends (...args: any[]) => any>(
  fn: T
): T => fn;
export const wrapAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => fn;
