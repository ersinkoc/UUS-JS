/**
 * Production-optimized entry point for UUS.js
 * Excludes development-only features and uses slim error handling
 */

import { Uus } from './uus';

// Core exports - always included
export { Uus };
export type {
  UusConfig,
  GlobalConfig,
  UusPlugin,
  Directive,
  DirectiveBinding,
  ReactiveState,
  Effect,
  Computed,
} from './types';
export { createReactive, effect, computed } from './reactive';

// Use slim error handling for production
export {
  ErrorCategory,
  ErrorSeverity,
  UusError,
  DirectiveError,
  EvaluationError,
  ReactiveError,
  ParsingError,
  MountingError,
  ValidationError,
  SlimErrorHandler,
  slimErrorHandler,
  validate,
  createSafeFunction,
  wrapAsync,
} from './errors/slim';

// Alias for compatibility
export { SlimErrorHandler as ErrorHandler } from './errors/slim';
export { slimErrorHandler as globalErrorHandler } from './errors/slim';

export type {
  UusErrorContext,
  ErrorHandlerConfig,
} from './errors';

// Minimal validation for production
export function validateElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function validateDirectiveExpression(expression: string): boolean {
  return typeof expression === 'string' && expression.length > 0;
}

// Stub out other validation functions to maintain API compatibility
export const validateDirectiveBinding = () => true;
export const validateUusInstance = () => true;
export const validateEventHandler = () => true;
export const validateClassBinding = () => true;
export const validateStyleBinding = () => true;
export const validateLoopData = () => true;

// Auto-initialize if in browser with script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as unknown as Window & { Uus: typeof Uus }).Uus = Uus;
}

// Development-only features are excluded from production builds