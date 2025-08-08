import { Uus } from './uus';
import type {
  DirectiveName,
  ExpressionString,
  ElementSelector,
  AttributeName,
  EventName,
} from './types';

// Core exports - always included
export { Uus };
export type {
  UusConfig,
  GlobalConfig,
  UusPlugin,
  UusInstance,
  Directive,
  DirectiveBinding,
  ReactiveState,
  Effect,
  Computed,
  DirectiveName,
  ExpressionString,
  ElementSelector,
  AttributeName,
  EventName,
} from './types';
export {
  createReactive,
  reactive,
  effect,
  computed,
  registerEffectCleanup,
  abortableEffect,
  deepReactive,
  shallowReactive,
  readonly,
  batchUpdates,
} from './reactive';

// Utility functions for branded types
export function directiveName<T extends string = string>(
  name: T
): DirectiveName<T> {
  return name as DirectiveName<T>;
}

export function expressionString(expr: string): ExpressionString {
  return expr as ExpressionString;
}

export function elementSelector(selector: string): ElementSelector {
  return selector as ElementSelector;
}

export function attributeName(name: string): AttributeName {
  return name as AttributeName;
}

export function eventName(name: string): EventName {
  return name as EventName;
}

// Optional exports - can be tree-shaken if unused
export type { UusErrorContext, ErrorHandlerConfig } from './errors';

// Development/Debug exports - mark as side-effect free for tree shaking
export {
  ErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  UusError,
  DirectiveError,
  EvaluationError,
  ReactiveError,
  ParsingError,
  MountingError,
  ValidationError,
  globalErrorHandler,
  validate,
  createSafeFunction,
  wrapAsync,
} from './errors';

// Validation exports - mark as optional for production
export {
  validateElement,
  validateDirectiveExpression,
  validateDirectiveBinding,
  validateUusInstance,
  validateEventHandler,
  validateClassBinding,
  validateStyleBinding,
  validateLoopData,
} from './validation';

// Memory Management exports - for advanced users and debugging
export {
  memoryManager,
  ResourceTracker,
  CleanupRegistry,
  CircularReferenceManager,
} from './memory';

// Leak Detection exports - for development and debugging
export {
  leakDetector,
  MemoryLeakDetector,
  initLeakDetection,
  forceGC,
  runMemoryPressureTest,
} from './leak-detection';

export type { LeakReport, MemoryHealthReport } from './leak-detection';

export type {
  TrackedResource as MemoryTrackedResource,
  MemoryStats as MemoryManagerStats,
  LeakDetectionConfig as MemoryLeakConfig,
} from './memory';

// Lifecycle exports with memory management
export {
  registerComponent,
  mountComponent,
  updateComponent,
  destroyComponent,
  addComponentCleanup,
  registerComponentWithTracking,
  cleanupAllComponents,
  observeDOM,
} from './lifecycle';

// i18n exports
export { i18nPlugin, I18n, type I18nConfig, type I18nInstance } from './i18n';

// DevTools exports
export {
  DevTools,
  DevToolsExtensionBridge,
  initDevTools,
  type DevToolsConfig,
} from './devtools';

// Auto-initialize if in browser with script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as unknown as Window & { Uus: typeof Uus }).Uus = Uus;

  // Initialize memory leak detection in development
  if (process.env.NODE_ENV === 'development') {
    import('./leak-detection')
      .then(({ initLeakDetection }) => {
        initLeakDetection(true);
      })
      .catch((error) => {
        console.warn('Failed to initialize leak detection:', error);
      });
  }

  // Emergency cleanup handler for page unload
  window.addEventListener('beforeunload', () => {
    try {
      Uus.destroyAll();
    } catch (error) {
      console.warn('Error during emergency cleanup:', error);
    }
  });
}
