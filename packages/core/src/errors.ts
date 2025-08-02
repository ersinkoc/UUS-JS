/**
 * UUS.js Error Handling System
 * 
 * Provides comprehensive error handling with:
 * - Custom error classes for different types of failures
 * - Centralized error logging and reporting
 * - Development-friendly debugging information
 * - Graceful error recovery mechanisms
 * - Configurable error handling behavior
 */

// ============================================================================
// Error Types and Categories
// ============================================================================

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
  LOW = 'low',         // Warning-level, non-breaking issues
  MEDIUM = 'medium',   // Errors that affect functionality but don't crash
  HIGH = 'high',       // Critical errors that may break features
  CRITICAL = 'critical' // System-level failures that require immediate attention
}

// ============================================================================
// Base Error Classes
// ============================================================================

export interface UusErrorContext {
  element?: HTMLElement;
  expression?: string;
  directive?: string;
  state?: Record<string, unknown> | string[];
  timestamp?: number;
  stackTrace?: string;
  userAgent?: string;
  additionalInfo?: Record<string, unknown>;
  // Additional context properties used throughout the codebase
  phase?: string;
  effectFunction?: string;
  operation?: string;
  target?: string | HTMLElement;
  originalError?: string;
  value?: unknown;
  field?: string;
  requirement?: string;
  attribute?: string;
  // For directive-specific contexts
  itemsExpression?: string;
  itemsValue?: unknown;
  itemsType?: string;
  parentElement?: HTMLElement;
  itemIndex?: number;
  item?: unknown;
  instance?: HTMLElement;
  shouldShow?: boolean;
  handler?: unknown;
  directivePart?: string;
  attributeName?: string;
  attributeValue?: string;
  parsed?: unknown;
  childElement?: HTMLElement;
  errorCount?: number;
  maxErrors?: number;
  method?: string;
  key?: string;
  args?: unknown[];
  // Additional properties used in evaluator and core modules
  expectedType?: string;
  pluginName?: string;
  eventType?: string;
  actualType?: string;
  // For i18n context
  config?: unknown;
  locale?: string;
  availableLocales?: string[];
  binding?: unknown;
}

export class UusError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context: UusErrorContext;
  public readonly code: string;
  public readonly recoverable: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: UusErrorContext = {},
    code?: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'UusError';
    this.category = category;
    this.severity = severity;
    this.context = {
      timestamp: Date.now(),
      stackTrace: this.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...context
    };
    this.code = code || `UUS_${category.toUpperCase()}_ERROR`;
    this.recoverable = recoverable;
    this.timestamp = Date.now();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UusError);
    }
  }

  /**
   * Creates a user-friendly error message suitable for display
   */
  getUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.EVALUATION:
        return 'There was an issue evaluating an expression. Please check your syntax.';
      case ErrorCategory.DIRECTIVE:
        return 'A directive encountered an error. The element may not behave as expected.';
      case ErrorCategory.REACTIVE:
        return 'The reactive system encountered an issue. Some updates may not work properly.';
      case ErrorCategory.PARSING:
        return 'There was an issue parsing directives. Please check your HTML attributes.';
      case ErrorCategory.MOUNTING:
        return 'Failed to mount the application. Please check your target element.';
      case ErrorCategory.VALIDATION:
        return 'Input validation failed. Please check your data.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  /**
   * Creates a detailed debug message for developers
   */
  getDebugMessage(): string {
    const parts = [
      `[${this.code}] ${this.message}`,
      `Category: ${this.category}`,
      `Severity: ${this.severity}`,
      `Recoverable: ${this.recoverable}`,
    ];

    if (this.context.directive) {
      parts.push(`Directive: ${this.context.directive}`);
    }

    if (this.context.expression) {
      parts.push(`Expression: ${this.context.expression}`);
    }

    if (this.context.element) {
      const tagName = this.context.element.tagName.toLowerCase();
      const id = this.context.element.id ? `#${this.context.element.id}` : '';
      const className = this.context.element.className ? `.${this.context.element.className.split(' ').join('.')}` : '';
      parts.push(`Element: ${tagName}${id}${className}`);
    }

    return parts.join('\n  ');
  }

  /**
   * Serializes error for logging or reporting
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      context: {
        ...this.context,
        element: this.context.element ? {
          tagName: this.context.element.tagName,
          id: this.context.element.id,
          className: this.context.element.className,
        } : undefined,
        state: this.context.state ? Object.keys(this.context.state) : undefined, // Don't serialize actual state values
      },
      stack: this.stack,
    };
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

export class EvaluationError extends UusError {
  constructor(
    expression: string,
    originalError: Error,
    context: UusErrorContext = {}
  ) {
    const message = `Failed to evaluate expression "${expression}": ${originalError.message}`;
    super(
      message,
      ErrorCategory.EVALUATION,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        expression,
        originalError: originalError.message,
      },
      'UUS_EVALUATION_ERROR',
      true
    );
    this.name = 'EvaluationError';
  }
}

export class DirectiveError extends UusError {
  constructor(
    directiveName: string,
    operation: string,
    originalError: Error,
    context: UusErrorContext = {}
  ) {
    const message = `Directive "${directiveName}" failed during ${operation}: ${originalError.message}`;
    super(
      message,
      ErrorCategory.DIRECTIVE,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        directive: directiveName,
        operation,
        originalError: originalError.message,
      },
      'UUS_DIRECTIVE_ERROR',
      true
    );
    this.name = 'DirectiveError';
  }
}

export class ReactiveError extends UusError {
  constructor(
    operation: string,
    originalError: Error,
    context: UusErrorContext = {}
  ) {
    const message = `Reactive system error during ${operation}: ${originalError.message}`;
    super(
      message,
      ErrorCategory.REACTIVE,
      ErrorSeverity.HIGH,
      {
        ...context,
        operation,
        originalError: originalError.message,
      },
      'UUS_REACTIVE_ERROR',
      false // Reactive errors are often not recoverable
    );
    this.name = 'ReactiveError';
  }
}

export class ParsingError extends UusError {
  constructor(
    element: HTMLElement,
    attribute: string,
    originalError: Error,
    context: UusErrorContext = {}
  ) {
    const message = `Failed to parse directive attribute "${attribute}": ${originalError.message}`;
    super(
      message,
      ErrorCategory.PARSING,
      ErrorSeverity.MEDIUM,
      {
        ...context,
        element,
        attribute,
        originalError: originalError.message,
      },
      'UUS_PARSING_ERROR',
      true
    );
    this.name = 'ParsingError';
  }
}

export class MountingError extends UusError {
  constructor(
    target: string | HTMLElement,
    originalError: Error,
    context: UusErrorContext = {}
  ) {
    const targetDesc = typeof target === 'string' ? target : target.tagName;
    const message = `Failed to mount application to "${targetDesc}": ${originalError.message}`;
    super(
      message,
      ErrorCategory.MOUNTING,
      ErrorSeverity.CRITICAL,
      {
        ...context,
        target: typeof target === 'string' ? target : target.tagName,
        originalError: originalError.message,
      },
      'UUS_MOUNTING_ERROR',
      false
    );
    this.name = 'MountingError';
  }
}

export class ValidationError extends UusError {
  constructor(
    field: string,
    value: unknown,
    requirement: string,
    context: UusErrorContext = {}
  ) {
    const message = `Validation failed for "${field}": ${requirement}`;
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      {
        ...context,
        field,
        value: typeof value,
        requirement,
      },
      'UUS_VALIDATION_ERROR',
      true
    );
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Error Handler Interface and Configuration
// ============================================================================

export interface ErrorHandlerConfig {
  /** Whether to log errors to console */
  logToConsole: boolean;
  /** Whether to include debug information in development */
  includeDebugInfo: boolean;
  /** Whether to show user-friendly error messages */
  showUserMessages: boolean;
  /** Custom error reporting function */
  onError?: (error: UusError) => void;
  /** Function to determine if we're in development mode */
  isDevelopment?: () => boolean;
  /** Maximum number of errors to track */
  maxErrors?: number;
  /** Whether to attempt error recovery */
  enableRecovery: boolean;
}

export const defaultErrorConfig: ErrorHandlerConfig = {
  logToConsole: true,
  includeDebugInfo: true,
  showUserMessages: false,
  enableRecovery: true,
  maxErrors: 100,
  isDevelopment: () => {
    return (
      typeof process !== 'undefined' && 
      process.env?.NODE_ENV === 'development'
    ) || 
    (typeof window !== 'undefined' && window.location?.hostname === 'localhost');
  },
};

// ============================================================================
// Centralized Error Handler
// ============================================================================

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorHistory: UusError[] = [];
  private errorCounts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultErrorConfig, ...config };
  }

  /**
   * Updates the error handler configuration
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handles a UUS error with appropriate logging and recovery
   */
  handle(error: UusError): void {
    // Track error for analytics
    this.trackError(error);

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logError(error);
    }

    // Call custom error handler if provided
    if (this.config.onError) {
      try {
        this.config.onError(error);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Show user message if enabled and severity is high enough
    if (this.config.showUserMessages && error.severity !== ErrorSeverity.LOW) {
      this.showUserMessage(error);
    }

    // Attempt recovery if enabled and error is recoverable
    if (this.config.enableRecovery && error.recoverable) {
      this.attemptRecovery(error);
    }
  }

  /**
   * Creates and handles an error from a generic Error
   */
  handleGenericError(
    originalError: Error,
    category: ErrorCategory,
    context: UusErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): void {
    const uusError = new UusError(
      originalError.message,
      category,
      severity,
      context,
      undefined,
      category !== ErrorCategory.REACTIVE // Most errors are recoverable except reactive
    );
    
    this.handle(uusError);
  }

  /**
   * Safely executes a function with error handling
   */
  safe<T>(
    fn: () => T,
    category: ErrorCategory,
    context: UusErrorContext = {},
    fallback?: T
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      this.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        category,
        context
      );
      return fallback;
    }
  }

  /**
   * Tracks error for analytics and debugging
   */
  private trackError(error: UusError): void {
    // Add to history
    this.errorHistory.push(error);
    
    // Maintain size limit
    if (this.config.maxErrors && this.errorHistory.length > this.config.maxErrors) {
      this.errorHistory.shift();
    }

    // Track counts
    const count = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, count + 1);
  }

  /**
   * Logs error with appropriate detail level
   */
  private logError(error: UusError): void {
    const isDev = this.config.isDevelopment?.() ?? false;
    
    if (isDev && this.config.includeDebugInfo) {
      // Development: show full debug information
      console.group(`🔴 UUS Error [${error.severity.toUpperCase()}]`);
      console.error(error.getDebugMessage());
      console.error('Full Error Object:', error);
      if (error.context.element) {
        console.error('Element:', error.context.element);
      }
      if (error.context.state && Object.keys(error.context.state).length > 0) {
        console.error('State Keys:', Object.keys(error.context.state));
      }
      console.groupEnd();
    } else {
      // Production: show basic error information
      const severity = error.severity === ErrorSeverity.CRITICAL ? '🚨' : 
                      error.severity === ErrorSeverity.HIGH ? '🔴' : 
                      error.severity === ErrorSeverity.MEDIUM ? '🟡' : '🔵';
      console.error(`${severity} [${error.code}] ${error.message}`);
    }
  }

  /**
   * Shows user-friendly error message
   */
  private showUserMessage(error: UusError): void {
    // This could be implemented to show toast notifications, modal dialogs, etc.
    // For now, we'll just log the user message
    console.warn('User Message:', error.getUserMessage());
  }

  /**
   * Attempts to recover from recoverable errors
   */
  private attemptRecovery(error: UusError): void {
    // Basic recovery strategies based on error category
    switch (error.category) {
      case ErrorCategory.EVALUATION:
        // For evaluation errors, we typically fall back to undefined/empty values
        // This is handled in the evaluator itself
        break;
      
      case ErrorCategory.DIRECTIVE:
        // For directive errors, we might try to remove the directive or reset the element
        if (error.context.element && error.context.directive) {
          try {
            // Remove the problematic directive attribute
            const prefix = 'uus-';
            Array.from(error.context.element.attributes).forEach(attr => {
              if (attr.name.startsWith(prefix + error.context.directive!)) {
                error.context.element!.removeAttribute(attr.name);
              }
            });
          } catch (recoveryError) {
            console.warn('Recovery attempt failed:', recoveryError);
          }
        }
        break;
      
      case ErrorCategory.PARSING:
        // For parsing errors, remove the problematic attribute
        if (error.context.element && error.context.attribute) {
          try {
            error.context.element.removeAttribute(error.context.attribute);
          } catch (recoveryError) {
            console.warn('Recovery attempt failed:', recoveryError);
          }
        }
        break;
    }
  }

  /**
   * Gets error statistics for debugging
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    mostCommonErrors: Array<{ code: string; count: number }>;
    recentErrors: UusError[];
  } {
    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    // Get most common errors
    const mostCommonErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      mostCommonErrors,
      recentErrors: this.errorHistory.slice(-10),
    };
  }

  /**
   * Clears error history and counts
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.errorCounts.clear();
  }
}

// ============================================================================
// Global Error Handler Instance
// ============================================================================

export const globalErrorHandler = new ErrorHandler();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a safe wrapper around a function that handles errors gracefully
 */
export function createSafeFunction<T extends (...args: any[]) => any>(
  fn: T,
  category: ErrorCategory,
  context: UusErrorContext = {},
  fallback?: ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return globalErrorHandler.safe(
      () => fn(...args),
      category,
      context,
      fallback
    );
  }) as T;
}

/**
 * Validates that a value meets certain requirements
 */
export function validate(
  field: string,
  value: unknown,
  requirements: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => boolean | string;
  },
  context: UusErrorContext = {}
): void {
  if (requirements.required && (value === null || value === undefined || value === '')) {
    throw new ValidationError(field, value, 'Field is required', context);
  }

  if (value !== null && value !== undefined) {
    if (requirements.type && typeof value !== requirements.type) {
      throw new ValidationError(field, value, `Expected type ${requirements.type}`, context);
    }

    if (requirements.minLength && typeof value === 'string' && value.length < requirements.minLength) {
      throw new ValidationError(field, value, `Minimum length is ${requirements.minLength}`, context);
    }

    if (requirements.maxLength && typeof value === 'string' && value.length > requirements.maxLength) {
      throw new ValidationError(field, value, `Maximum length is ${requirements.maxLength}`, context);
    }

    if (requirements.pattern && typeof value === 'string' && !requirements.pattern.test(value)) {
      throw new ValidationError(field, value, `Value does not match required pattern`, context);
    }

    if (requirements.custom) {
      const result = requirements.custom(value);
      if (result !== true) {
        const message = typeof result === 'string' ? result : 'Custom validation failed';
        throw new ValidationError(field, value, message, context);
      }
    }
  }
}

/**
 * Wraps an async function with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  category: ErrorCategory,
  context: UusErrorContext = {}
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error) {
      globalErrorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        category,
        context
      );
      throw error; // Re-throw for async error handling
    }
  }) as T;
}