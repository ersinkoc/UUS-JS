// ============================================================================
// BRANDED TYPES - For enhanced type safety in domain-specific contexts
// ============================================================================

/** Brand for directive names to prevent string confusion */
export type DirectiveName<T extends string = string> = T & { readonly __brand: 'DirectiveName' };

/** Brand for element selectors */
export type ElementSelector = string & { readonly __brand: 'ElementSelector' };

/** Brand for HTML attribute names */
export type AttributeName = string & { readonly __brand: 'AttributeName' };

/** Brand for event names */
export type EventName = string & { readonly __brand: 'EventName' };

/** Brand for expression strings */
export type ExpressionString = string & { readonly __brand: 'ExpressionString' };

// ============================================================================
// TEMPLATE LITERAL TYPES - For directive name validation
// ============================================================================

/** Core directive names as template literals */
export type CoreDirectiveNames = 
  | 'state' | 'text' | 'html' | 'show' | 'if' | 'for' 
  | 'model' | 'bind' | 'class' | 'style' | 'on' | 'component';

/** Event directive pattern */
export type EventDirective<T extends string = string> = `on:${T}`;

/** Bind directive pattern */
export type BindDirective<T extends string = string> = `bind:${T}`;

/** All possible directive patterns */
export type DirectivePattern<T extends string = string> = 
  | CoreDirectiveNames
  | EventDirective<T>
  | BindDirective<T>
  | T;

// ============================================================================
// DISCRIMINATED UNIONS - For better type narrowing
// ============================================================================

/** Discriminated union for different directive types */
export type DirectiveType = 
  | { kind: 'state'; binding: StateDirectiveBinding }
  | { kind: 'event'; binding: EventDirectiveBinding }
  | { kind: 'bind'; binding: BindDirectiveBinding }
  | { kind: 'conditional'; binding: ConditionalDirectiveBinding }
  | { kind: 'loop'; binding: LoopDirectiveBinding }
  | { kind: 'content'; binding: ContentDirectiveBinding }
  | { kind: 'style'; binding: StyleDirectiveBinding }
  | { kind: 'generic'; binding: GenericDirectiveBinding };

/** Result type for operations that can succeed or fail */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Mount target validation result */
export type MountTarget = 
  | { type: 'element'; element: HTMLElement }
  | { type: 'selector'; selector: ElementSelector; resolved: HTMLElement }
  | { type: 'invalid'; reason: string };

// ============================================================================
// ENHANCED CONFIGURATION TYPES
// ============================================================================

/** Enhanced error handler with better typing */
export interface ErrorHandler {
  (error: Error): void;
  (error: Error, context?: Record<string, unknown>): void;
}

/** Strict UUS configuration with better defaults */
export interface UusConfig {
  /** Enable debug mode with enhanced logging */
  readonly debug?: boolean;
  
  /** Directive prefix (default: 'uus-') */
  readonly prefix?: string;
  
  /** Enhanced error handler with context support */
  readonly onError?: ErrorHandler;
  
  /** Instance-level plugins to install */
  readonly plugins?: readonly UusPlugin[];
  
  /** Performance monitoring options */
  readonly performance?: {
    readonly trackDirectives?: boolean;
    readonly trackReactivity?: boolean;
    readonly maxCallStack?: number;
  };
  
  /** Security options */
  readonly security?: {
    readonly allowedGlobals?: readonly string[];
    readonly maxExpressionLength?: number;
    readonly sanitizeHtml?: boolean;
  };
}

/** Global configuration extending base config */
export interface GlobalConfig extends UusConfig {
  // plugins property is inherited from UusConfig
}

// ============================================================================
// PLUGIN SYSTEM TYPES
// ============================================================================

/** Plugin metadata for better introspection */
export interface PluginMetadata {
  readonly name: string;
  readonly version?: string;
  readonly description?: string;
  readonly author?: string;
  readonly dependencies?: readonly string[];
}

/** Enhanced plugin interface with metadata and lifecycle */
export interface UusPlugin {
  readonly name: string;
  readonly metadata?: PluginMetadata;
  readonly install: (uus: UusInstance) => void | Promise<void>;
  readonly uninstall?: (uus: UusInstance) => void | Promise<void>;
}

// ============================================================================
// MAIN UUS INTERFACE
// ============================================================================

/** Main UUS interface with enhanced type safety */
export interface Uus {
  mount(element: HTMLElement): void;
  mount(selector: ElementSelector): void;
  mount(element: HTMLElement | ElementSelector): void;
  unmount(): void;
  use(plugin: UusPlugin): void;
}

// ============================================================================
// REACTIVE SYSTEM TYPES
// ============================================================================

/** Effect function with optional cleanup */
export type Effect = () => void | (() => void);

/** Computed getter function */
export type Computed<T> = () => T;

/** Watch callback function */
export type WatchCallback<T> = (newValue: T, oldValue: T | undefined) => void;

/** Watch options */
export interface WatchOptions {
  readonly immediate?: boolean;
  readonly deep?: boolean;
}

/** Enhanced reactive state with better constraints */
export interface ReactiveState {
  readonly [key: string]: unknown;
  readonly [key: symbol]: unknown;
}

/** Reactive proxy markers */
export interface ReactiveMarkers {
  readonly __isReactive?: true;
  readonly __raw?: unknown;
  readonly __markRaw?: true;
}

/** Ref interface with enhanced typing */
export interface Ref<T = unknown> {
  value: T;
  readonly __isRef: true;
}

/** Computed ref interface */
export interface ComputedRef<T = unknown> extends Readonly<Ref<T>> {
  readonly value: T;
}

// ============================================================================
// DIRECTIVE BINDING TYPES
// ============================================================================

/** Base directive binding interface */
export interface BaseDirectiveBinding {
  readonly value: unknown;
  readonly oldValue?: unknown;
  readonly expression?: ExpressionString;
}

/** State directive specific binding */
export interface StateDirectiveBinding extends BaseDirectiveBinding {
  readonly value: Record<string, unknown>;
}

/** Event directive specific binding */
export interface EventDirectiveBinding extends BaseDirectiveBinding {
  readonly arg: EventName;
  readonly modifiers: EventModifiers;
  readonly value: ExpressionString | Function;
}

/** Bind directive specific binding */
export interface BindDirectiveBinding extends BaseDirectiveBinding {
  readonly arg: AttributeName;
  readonly value: unknown;
}

/** Conditional directive binding (if, show) */
export interface ConditionalDirectiveBinding extends BaseDirectiveBinding {
  readonly value: boolean | unknown;
}

/** Loop directive binding (for) */
export interface LoopDirectiveBinding extends BaseDirectiveBinding {
  readonly value: Iterable<unknown> | Record<string, unknown>;
}

/** Content directive binding (text, html) */
export interface ContentDirectiveBinding extends BaseDirectiveBinding {
  readonly value: string | number | null | undefined;
}

/** Style directive binding */
export interface StyleDirectiveBinding extends BaseDirectiveBinding {
  readonly value: string | Record<string, string | number | null | undefined>;
}

/** Generic directive binding for custom directives */
export interface GenericDirectiveBinding extends BaseDirectiveBinding {
  readonly arg?: string;
  readonly modifiers?: Record<string, boolean>;
}

/** Union of all directive binding types */
export type DirectiveBinding = 
  | StateDirectiveBinding
  | EventDirectiveBinding
  | BindDirectiveBinding
  | ConditionalDirectiveBinding
  | LoopDirectiveBinding
  | ContentDirectiveBinding
  | StyleDirectiveBinding
  | GenericDirectiveBinding;

// ============================================================================
// EVENT SYSTEM TYPES
// ============================================================================

/** Event modifiers with specific typing */
export interface EventModifiers {
  readonly prevent?: boolean;
  readonly stop?: boolean;
  readonly capture?: boolean;
  readonly once?: boolean;
  readonly passive?: boolean;
  readonly self?: boolean;
}

/** Event handler types */
export type EventHandler<E extends Event = Event> = 
  | ((event: E) => void)
  | ((event: E) => Promise<void>)
  | ExpressionString;

// ============================================================================
// DIRECTIVE SYSTEM TYPES
// ============================================================================

/** Directive lifecycle hooks with enhanced typing */
export interface DirectiveHooks<T extends DirectiveBinding = DirectiveBinding> {
  readonly init?: (el: HTMLElement, binding: T, uus: UusInstance) => void;
  readonly bind?: (el: HTMLElement, binding: T, uus: UusInstance) => void;
  readonly update?: (el: HTMLElement, binding: T, uus: UusInstance) => void;
  readonly unbind?: (el: HTMLElement, binding: T, uus: UusInstance) => void;
}

/** Enhanced directive interface */
export interface Directive<T extends DirectiveBinding = DirectiveBinding> extends DirectiveHooks<T> {
  readonly name: DirectiveName;
  readonly metadata?: {
    readonly description?: string;
    readonly example?: string;
    readonly category?: 'content' | 'conditional' | 'loop' | 'event' | 'binding' | 'style' | 'state' | 'custom';
  };
}

// ============================================================================
// UUS INSTANCE TYPE
// ============================================================================

/** Enhanced UUS instance interface */
export interface UusInstance {
  readonly state: ReactiveState;
  readonly effects: Set<Effect>;
  readonly cleanups: WeakMap<object, Set<() => void>>;
  readonly directives: Map<DirectiveName, Directive>;
  rootElement: HTMLElement | null;
  readonly config: UusConfig;
  readonly errorHandler: import('./errors').ErrorHandler;
  
  /** Register a new directive */
  registerDirective<T extends DirectiveBinding = DirectiveBinding>(
    directive: Directive<T>
  ): void;
  
  /** Mount to an element or selector */
  mount(target: HTMLElement | ElementSelector): void;
  
  /** Unmount and cleanup */
  unmount(): void;
  
  /** Install a plugin */
  use(plugin: UusPlugin): void;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/** Type predicate for checking if value is a Ref */
export function isRef<T = unknown>(value: unknown): value is Ref<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isRef === true
  );
}

/** Type predicate for checking if value is reactive */
export function isReactive(value: unknown): value is ReactiveState & ReactiveMarkers {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__isReactive === true
  );
}

/** Type predicate for directive names */
export function isDirectiveName(value: string): value is DirectiveName {
  return typeof value === 'string' && value.length > 0;
}

/** Type predicate for element selectors */
export function isElementSelector(value: string): value is ElementSelector {
  return typeof value === 'string' && value.length > 0;
}

// ============================================================================
// CONDITIONAL TYPES FOR API ERGONOMICS
// ============================================================================

/** Extract directive binding type based on directive name */
export type DirectiveBindingFor<T extends string> = 
  T extends 'state' ? StateDirectiveBinding :
  T extends 'on' ? EventDirectiveBinding :
  T extends 'bind' ? BindDirectiveBinding :
  T extends 'if' | 'show' ? ConditionalDirectiveBinding :
  T extends 'for' ? LoopDirectiveBinding :
  T extends 'text' | 'html' ? ContentDirectiveBinding :
  T extends 'style' | 'class' ? StyleDirectiveBinding :
  GenericDirectiveBinding;

/** Extract element type from mount target */
export type ElementFromTarget<T> = 
  T extends HTMLElement ? T :
  T extends ElementSelector ? HTMLElement :
  HTMLElement;

/** Extract return type from effect function */
export type EffectCleanup<T extends Effect> = 
  T extends () => infer R ? 
    R extends () => void ? R : 
    () => void : 
  () => void;

// ============================================================================
// HELPER TYPE UTILITIES
// ============================================================================

/** Make all properties readonly recursively */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Make specific properties required */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Extract non-function properties */
export type NonFunctionProps<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/** Extract function properties */
export type FunctionProps<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

// ============================================================================
// RE-EXPORTS FOR COMPREHENSIVE TYPE SAFETY
// ============================================================================

// Re-export comprehensive type guards for convenience
export * from './type-guards';
