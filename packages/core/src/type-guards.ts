// ============================================================================
// COMPREHENSIVE TYPE GUARDS FOR RUNTIME VALIDATION
// ============================================================================

import type {
  DirectiveName,
  ElementSelector,
  ExpressionString,
  EventName,
  AttributeName,
  Ref,
  ReactiveState,
  ReactiveMarkers,
  DirectiveBinding,
  EventDirectiveBinding,
  BindDirectiveBinding,
  StateDirectiveBinding,
  ConditionalDirectiveBinding,
  LoopDirectiveBinding,
  ContentDirectiveBinding,
  StyleDirectiveBinding,
  UusPlugin,
  UusConfig,
  Directive,
  Effect,
  EventHandler,
  Result,
} from './types';

// ============================================================================
// BRANDED TYPE GUARDS
// ============================================================================

/**
 * Type guard for directive names
 */
export function isDirectiveName(value: unknown): value is DirectiveName {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    /^[a-zA-Z][a-zA-Z0-9:-]*$/.test(value)
  );
}

/**
 * Type guard for element selectors
 */
export function isElementSelector(value: unknown): value is ElementSelector {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    // Test if it's a valid CSS selector by attempting to query it
    document.querySelector(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for expression strings
 */
export function isExpressionString(value: unknown): value is ExpressionString {
  return typeof value === 'string';
}

/**
 * Type guard for event names
 */
export function isEventName(value: unknown): value is EventName {
  return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9]*$/.test(value);
}

/**
 * Type guard for attribute names
 */
export function isAttributeName(value: unknown): value is AttributeName {
  return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9-]*$/.test(value);
}

// ============================================================================
// REACTIVE SYSTEM TYPE GUARDS
// ============================================================================

/**
 * Type guard for Ref objects
 */
export function isRef<T = unknown>(value: unknown): value is Ref<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isRef === true
  );
}

/**
 * Type guard for reactive objects
 */
export function isReactive(
  value: unknown
): value is ReactiveState & ReactiveMarkers {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isReactive === true
  );
}

/**
 * Type guard for reactive markers
 */
export function hasReactiveMarkers(value: unknown): value is ReactiveMarkers {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return '__isReactive' in obj || '__raw' in obj || '__markRaw' in obj;
}

/**
 * Type guard for effect functions
 */
export function isEffect(value: unknown): value is Effect {
  return typeof value === 'function';
}

// ============================================================================
// DIRECTIVE BINDING TYPE GUARDS
// ============================================================================

/**
 * Type guard for base directive binding
 */
export function isDirectiveBinding(value: unknown): value is DirectiveBinding {
  return value !== null && typeof value === 'object' && 'value' in value;
}

/**
 * Type guard for state directive binding
 */
export function isStateDirectiveBinding(
  value: unknown
): value is StateDirectiveBinding {
  return (
    isDirectiveBinding(value) &&
    typeof (value as StateDirectiveBinding).value === 'object' &&
    (value as StateDirectiveBinding).value !== null
  );
}

/**
 * Type guard for event directive binding
 */
export function isEventDirectiveBinding(
  value: unknown
): value is EventDirectiveBinding {
  return (
    isDirectiveBinding(value) &&
    'arg' in value &&
    'modifiers' in value &&
    typeof (value as EventDirectiveBinding).arg === 'string' &&
    typeof (value as EventDirectiveBinding).modifiers === 'object'
  );
}

/**
 * Type guard for bind directive binding
 */
export function isBindDirectiveBinding(
  value: unknown
): value is BindDirectiveBinding {
  return (
    isDirectiveBinding(value) &&
    'arg' in value &&
    typeof (value as BindDirectiveBinding).arg === 'string'
  );
}

/**
 * Type guard for conditional directive binding
 */
export function isConditionalDirectiveBinding(
  value: unknown
): value is ConditionalDirectiveBinding {
  return isDirectiveBinding(value);
}

/**
 * Type guard for loop directive binding
 */
export function isLoopDirectiveBinding(
  value: unknown
): value is LoopDirectiveBinding {
  const binding = value as LoopDirectiveBinding;
  return (
    isDirectiveBinding(value) &&
    (Array.isArray(binding.value) ||
      (typeof binding.value === 'object' && binding.value !== null) ||
      typeof binding.value === 'string')
  );
}

/**
 * Type guard for content directive binding
 */
export function isContentDirectiveBinding(
  value: unknown
): value is ContentDirectiveBinding {
  const binding = value as ContentDirectiveBinding;
  return (
    isDirectiveBinding(value) &&
    (typeof binding.value === 'string' ||
      typeof binding.value === 'number' ||
      binding.value === null ||
      binding.value === undefined)
  );
}

/**
 * Type guard for style directive binding
 */
export function isStyleDirectiveBinding(
  value: unknown
): value is StyleDirectiveBinding {
  const binding = value as StyleDirectiveBinding;
  return (
    isDirectiveBinding(value) &&
    (typeof binding.value === 'string' ||
      (typeof binding.value === 'object' && binding.value !== null))
  );
}

// ============================================================================
// EVENT SYSTEM TYPE GUARDS
// ============================================================================

/**
 * Type guard for event handlers
 */
export function isEventHandler(value: unknown): value is EventHandler {
  return typeof value === 'function' || typeof value === 'string';
}

/**
 * Type guard for DOM events
 */
export function isDOMEvent(value: unknown): value is Event {
  return value instanceof Event;
}

/**
 * Type guard for HTML elements
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

// ============================================================================
// PLUGIN SYSTEM TYPE GUARDS
// ============================================================================

/**
 * Type guard for UUS plugins
 */
export function isUusPlugin(value: unknown): value is UusPlugin {
  return (
    value !== null &&
    typeof value === 'object' &&
    'name' in value &&
    'install' in value &&
    typeof (value as UusPlugin).name === 'string' &&
    typeof (value as UusPlugin).install === 'function'
  );
}

/**
 * Type guard for UUS config
 */
export function isUusConfig(value: unknown): value is UusConfig {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const config = value as Record<string, unknown>;

  // Check optional properties
  if ('debug' in config && typeof config.debug !== 'boolean') {
    return false;
  }

  if ('prefix' in config && typeof config.prefix !== 'string') {
    return false;
  }

  if ('onError' in config && typeof config.onError !== 'function') {
    return false;
  }

  return true;
}

/**
 * Type guard for directives
 */
export function isDirective(value: unknown): value is Directive {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const directive = value as Record<string, unknown>;

  // Must have name
  if (!('name' in directive) || typeof directive.name !== 'string') {
    return false;
  }

  // Must have at least one lifecycle hook
  const hooks = ['init', 'bind', 'update', 'unbind'];
  const hasHook = hooks.some(
    (hook) => hook in directive && typeof directive[hook] === 'function'
  );

  return hasHook;
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

/**
 * Type guard for Result success
 */
export function isResultSuccess<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for Result failure
 */
export function isResultFailure<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Type guard for iterable objects
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.iterator in value &&
    typeof (value as any)[Symbol.iterator] === 'function'
  );
}

/**
 * Type guard for plain objects (not arrays, dates, etc.)
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof Error) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Type guard for functions
 */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * Type guard for promises
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as any).then === 'function'
  );
}

/**
 * Type guard for non-null values
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for string or number (for attribute values)
 */
export function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

// ============================================================================
// COMPLEX VALIDATION GUARDS
// ============================================================================

/**
 * Validates directive name format with specific patterns
 */
export function validateDirectiveNameFormat(
  name: string
): name is DirectiveName {
  if (!isDirectiveName(name)) {
    return false;
  }

  // Check for valid directive patterns
  const patterns = [
    /^[a-zA-Z][a-zA-Z0-9]*$/, // Simple directive names
    /^on:[a-zA-Z][a-zA-Z0-9]*$/, // Event directives
    /^bind:[a-zA-Z][a-zA-Z0-9-]*$/, // Bind directives
  ];

  return patterns.some((pattern) => pattern.test(name));
}

/**
 * Validates state object structure
 */
export function validateStateStructure(state: unknown): state is ReactiveState {
  if (!isPlainObject(state)) {
    return false;
  }

  // Check for reserved properties
  const reserved = [
    '__isReactive',
    '__raw',
    '__markRaw',
    'constructor',
    'prototype',
  ];
  const keys = Object.keys(state);

  return !keys.some((key) => reserved.includes(key));
}

/**
 * Validates expression string safety
 */
export function validateExpressionSafety(
  expression: string
): expression is ExpressionString {
  if (!isExpressionString(expression)) {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /constructor/,
    /__proto__/,
    /prototype/,
    /import\s*\(/,
    /require\s*\(/,
    /process\./,
    /global\./,
    /window\./,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(expression));
}

/**
 * Creates a type-safe assertion function
 */
export function createTypeAssertion<T>(
  guard: (value: unknown) => value is T,
  errorMessage: string
) {
  return (value: unknown): T => {
    if (!guard(value)) {
      throw new TypeError(errorMessage);
    }
    return value;
  };
}

// ============================================================================
// EXPORTED ASSERTION FUNCTIONS
// ============================================================================

export const assertDirectiveName = createTypeAssertion(
  isDirectiveName,
  'Value must be a valid directive name'
);

export const assertElementSelector = createTypeAssertion(
  isElementSelector,
  'Value must be a valid CSS selector'
);

export const assertRef = createTypeAssertion(
  isRef,
  'Value must be a Ref object'
);

export const assertReactive = createTypeAssertion(
  isReactive,
  'Value must be a reactive object'
);

export const assertHTMLElement = createTypeAssertion(
  isHTMLElement,
  'Value must be an HTMLElement'
);

export const assertEventHandler = createTypeAssertion(
  isEventHandler,
  'Value must be an event handler function or string'
);

export const assertUusPlugin = createTypeAssertion(
  isUusPlugin,
  'Value must be a valid UUS plugin'
);

export const assertPlainObject = createTypeAssertion(
  isPlainObject,
  'Value must be a plain object'
);

export const assertExpressionString = createTypeAssertion(
  isExpressionString,
  'Value must be a valid expression string'
);

// ============================================================================
// BRANDED TYPE ASSERTION FUNCTIONS
// ============================================================================

/**
 * Converts a string to DirectiveName branded type with validation
 */
export function asDirectiveName(value: string): DirectiveName {
  if (!isDirectiveName(value)) {
    throw new TypeError(`Invalid directive name: ${value}`);
  }
  return value as DirectiveName;
}

/**
 * Converts a string to ExpressionString branded type
 */
export function asExpressionString(value: string): ExpressionString {
  if (typeof value !== 'string') {
    throw new TypeError(`Expression must be a string, got ${typeof value}`);
  }
  return value as ExpressionString;
}

/**
 * Converts a string to ElementSelector branded type with validation
 */
export function asElementSelector(value: string): ElementSelector {
  if (!isElementSelector(value)) {
    throw new TypeError(`Invalid CSS selector: ${value}`);
  }
  return value as ElementSelector;
}

/**
 * Converts a string to EventName branded type with validation
 */
export function asEventName(value: string): EventName {
  if (!isEventName(value)) {
    throw new TypeError(`Invalid event name: ${value}`);
  }
  return value as EventName;
}

/**
 * Converts a string to AttributeName branded type with validation
 */
export function asAttributeName(value: string): AttributeName {
  if (!isAttributeName(value)) {
    throw new TypeError(`Invalid attribute name: ${value}`);
  }
  return value as AttributeName;
}
