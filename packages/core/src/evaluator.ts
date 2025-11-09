import type {
  ReactiveState,
  ExpressionString,
  Result,
  EventHandler,
} from './types';
import {
  EvaluationError,
  ValidationError,
  ErrorCategory,
  globalErrorHandler,
  validate,
  createSafeFunction,
} from './errors';
import { safeEvaluateExpression, parseExpression } from './safe-evaluator';

const FORBIDDEN_GLOBALS = new Set([
  'eval',
  'Function',
  'constructor',
  '__proto__',
  'prototype',
]);

export function createSafeEvaluator(
  state: ReactiveState,
  options?: { throwOnError?: boolean }
): (expression: ExpressionString) => unknown {
  // Validate state parameter
  try {
    validate('state', state, {
      required: true,
      type: 'object',
      custom: (value) => {
        if (value === null) return 'State cannot be null';
        return true;
      },
    });
  } catch (error) {
    globalErrorHandler.handle(error as ValidationError);
    throw error;
  }

  const allowedGlobals = {
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    console,
    JSON,
    undefined: undefined,
    null: null,
    true: true,
    false: false,
  };

  return (expression: ExpressionString): unknown => {
    const context = {
      expression,
      state: Object.keys(state),
    };

    try {
      // Validate expression input
      validate(
        'expression',
        expression,
        {
          type: 'string',
          maxLength: 10000, // Prevent overly complex expressions
        },
        context
      );

      // Security check for forbidden keywords
      for (const forbidden of FORBIDDEN_GLOBALS) {
        if (expression.includes(forbidden)) {
          const error = new EvaluationError(
            expression,
            new Error(`Security violation: forbidden keyword "${forbidden}"`),
            context
          );

          if (options?.throwOnError) {
            throw error;
          }

          globalErrorHandler.handle(error);
          return undefined;
        }
      }

      // Handle empty expressions gracefully
      if (!expression || expression.trim() === '') {
        return undefined;
      }

      // Use safe AST-based evaluator instead of Function constructor
      return globalErrorHandler.safe(
        () => safeEvaluateExpression(expression, state),
        ErrorCategory.EVALUATION,
        { ...context, phase: 'execution' },
        undefined // Return undefined on execution failure
      );
    } catch (error) {
      if (error instanceof EvaluationError) {
        if (options?.throwOnError) {
          throw error;
        }
        globalErrorHandler.handle(error);
        return undefined; // Graceful fallback
      }

      const evaluationError = new EvaluationError(
        expression,
        error instanceof Error ? error : new Error(String(error)),
        context
      );

      if (options?.throwOnError) {
        throw evaluationError;
      }

      globalErrorHandler.handle(evaluationError);
      return undefined; // Graceful fallback
    }
  };
}

export function parseEventExpression(expression: ExpressionString): {
  handler: string;
  args: string[];
} {
  try {
    // Validate input
    validate('expression', expression, {
      required: true,
      type: 'string',
      maxLength: 1000,
    });

    const trimmedExpression = expression.trim();

    // Parse function call syntax: functionName(arg1, arg2, ...)
    const match = trimmedExpression.match(/^(\w+)\((.*)\)$/);
    if (match) {
      const [, handler, argsStr] = match;

      // Validate handler name
      if (!handler || !handler.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        throw new EvaluationError(
          expression,
          new Error('Invalid handler name'),
          { handler }
        );
      }

      const args = argsStr
        ? argsStr
            .split(',')
            .map((arg) => arg.trim())
            .filter(Boolean)
        : [];

      return { handler, args };
    }

    // Simple handler name without parentheses
    if (trimmedExpression.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
      return { handler: trimmedExpression, args: [] };
    }

    // For complex expressions (assignments, operations, etc.),
    // return the expression as-is for direct evaluation
    return { handler: expression, args: [] };
  } catch (error) {
    if (error instanceof EvaluationError || error instanceof ValidationError) {
      globalErrorHandler.handle(error);
    } else {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PARSING,
        { expression }
      );
    }

    // Return safe fallback
    return { handler: '', args: [] };
  }
}

// ============================================================================
// ENHANCED TYPE-SAFE EVALUATION FUNCTIONS
// ============================================================================

/**
 * Type-safe expression evaluator with validation
 */
export function safeEvaluate<T = unknown>(
  expression: ExpressionString,
  state: ReactiveState,
  expectedType?: 'string' | 'number' | 'boolean' | 'object' | 'function'
): Result<T, EvaluationError> {
  try {
    const evaluator = createSafeEvaluator(state);
    const result = evaluator(expression);

    // Type validation if expected type is provided
    if (expectedType && typeof result !== expectedType) {
      return {
        success: false,
        error: new EvaluationError(
          expression,
          new TypeError(`Expected ${expectedType}, got ${typeof result}`),
          { expectedType, actualType: typeof result }
        ),
      };
    }

    return { success: true, data: result as T };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof EvaluationError
          ? error
          : new EvaluationError(
              expression,
              error instanceof Error ? error : new Error(String(error)),
              { phase: 'safe-evaluation' }
            ),
    };
  }
}

/**
 * Evaluate expression as boolean with proper falsy handling
 */
export function evaluateAsBoolean(
  expression: ExpressionString,
  state: ReactiveState
): boolean {
  const result = safeEvaluate(expression, state);
  if (!result.success) {
    return false; // Safe fallback
  }

  return Boolean(result.data);
}

/**
 * Evaluate expression as string with null/undefined handling
 */
export function evaluateAsString(
  expression: ExpressionString,
  state: ReactiveState
): string {
  const result = safeEvaluate(expression, state);
  if (!result.success) {
    return ''; // Safe fallback
  }

  const value = result.data;
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

/**
 * Evaluate expression as number with NaN protection
 */
export function evaluateAsNumber(
  expression: ExpressionString,
  state: ReactiveState
): number {
  const result = safeEvaluate(expression, state);
  if (!result.success) {
    return 0; // Safe fallback
  }

  const num = Number(result.data);
  return isNaN(num) ? 0 : num;
}

/**
 * Evaluate expression and validate as event handler
 */
export function evaluateAsEventHandler(
  expression: ExpressionString,
  state: ReactiveState
): EventHandler | null {
  // First try to parse as event expression
  const parsed = parseEventExpression(expression);
  if (parsed.handler && state[parsed.handler]) {
    const handler = state[parsed.handler];
    if (typeof handler === 'function') {
      return handler as EventHandler;
    }
  }

  // Fall back to direct evaluation for simple function references
  // Only try function evaluation for expressions that could be function references
  const trimmed = expression.trim();
  const couldBeFunction =
    /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(trimmed) &&
    !trimmed.includes('=') &&
    !trimmed.includes('++') &&
    !trimmed.includes('--') &&
    !trimmed.includes('$event');

  if (couldBeFunction) {
    const result = safeEvaluate(expression, state, 'function');
    if (result.success && typeof result.data === 'function') {
      return result.data as EventHandler;
    }
  }

  // Return expression string as fallback
  return expression;
}

/**
 * Validate expression syntax without executing
 */
export function validateExpressionSyntax(
  expression: ExpressionString
): Result<true, SyntaxError> {
  try {
    // Basic syntax validation
    if (!expression || expression.trim() === '') {
      return { success: true, data: true };
    }

    // Use safe parser to validate syntax without executing
    parseExpression(expression);

    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof SyntaxError
          ? error
          : new SyntaxError(`Invalid expression syntax: ${String(error)}`),
    };
  }
}
