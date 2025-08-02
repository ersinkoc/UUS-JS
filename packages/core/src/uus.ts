import type {
  UusConfig,
  UusPlugin,
  UusInstance,
  Directive,
  GlobalConfig,
  DirectiveName,
  ElementSelector,
  MountTarget,
  Result,
  DirectiveBinding,
  ReactiveState
} from './types';
import { createReactive } from './reactive';
import { asDirectiveName, asExpressionString } from './type-guards';
import { walkElement, createBinding, type ParsedDirective } from './parser';
import { createSafeEvaluator } from './evaluator';
import { observeDOM } from './lifecycle';
import {
  stateDirective,
  textDirective,
  htmlDirective,
  showDirective,
  ifDirective,
  forDirective,
  modelDirective,
  bindDirective,
  classDirective,
  styleDirective,
  onDirective,
  componentDirective,
} from './directives';
import { 
  ErrorHandler, 
  MountingError, 
  DirectiveError, 
  ErrorCategory,
  globalErrorHandler,
  createSafeFunction,
  type ErrorHandlerConfig 
} from './errors';
import { memoryManager, CleanupRegistry } from './memory';

// Conditional imports for production optimization
const isProduction = process.env.NODE_ENV === 'production';
const errorModule = isProduction ? './errors/slim' : './errors';

export class Uus implements UusInstance {
  private installedPlugins?: Set<string>;
  static version = '0.0.1';
  private static globalConfig: GlobalConfig = {};
  private static instanceCounter = 0;

  state: UusInstance['state'];
  effects: UusInstance['effects'];
  cleanups: UusInstance['cleanups'];
  directives: UusInstance['directives'];
  rootElement: UusInstance['rootElement'];
  config: UusInstance['config'];
  
  // Error handling system
  public readonly errorHandler: ErrorHandler;
  
  // Track built-in directives
  private readonly builtinDirectives: Set<string>;
  
  // Memory management
  private readonly instanceId: string;
  private readonly memoryTracker: ReturnType<typeof memoryManager.init>;
  private readonly cleanupRegistry: CleanupRegistry;
  private readonly abortController: AbortController;
  private domObserver?: MutationObserver;
  private performanceObserver?: PerformanceObserver;
  private isDestroyed = false;

  constructor(config?: UusConfig) {
    // Generate unique instance ID
    this.instanceId = `uus-${++Uus.instanceCounter}-${Date.now()}`;
    
    // Initialize memory management
    this.memoryTracker = memoryManager.init(this.instanceId);
    this.cleanupRegistry = new CleanupRegistry();
    this.abortController = new AbortController();
    
    // Track abort controller cleanup
    this.cleanupRegistry.registerAbortController(this.abortController);
    
    this.state = createReactive({}) as ReactiveState;
    this.effects = new Set();
    this.cleanups = new WeakMap();
    this.directives = new Map();
    this.rootElement = null;
    this.config = {
      debug: false,
      prefix: 'uus-',
      ...Uus.globalConfig,
      ...config,
    };
    
    // Track instance creation
    this.memoryTracker.track('component', this, undefined, {
      instanceId: this.instanceId,
      config: this.config
    });

    // Initialize error handler with configuration
    this.errorHandler = new ErrorHandler({
      logToConsole: this.config.debug ?? true,
      includeDebugInfo: this.config.debug ?? true,
      showUserMessages: false, // Can be configured through config
      enableRecovery: true,
      isDevelopment: () => this.config.debug ?? false,
      onError: this.config.onError, // Allow custom error handlers through config
    });

    // Initialize built-in directives set
    this.builtinDirectives = new Set([
      'state', 'text', 'html', 'show', 'if', 'for', 
      'model', 'bind', 'class', 'style', 'on', 'component'
    ]);
    
    // Register core directives
    this.registerDirective(stateDirective);
    this.registerDirective(textDirective);
    this.registerDirective(htmlDirective);
    this.registerDirective(showDirective);
    this.registerDirective(ifDirective);
    this.registerDirective(forDirective);
    this.registerDirective(modelDirective);
    this.registerDirective(bindDirective);
    this.registerDirective(classDirective);
    this.registerDirective(styleDirective);
    this.registerDirective(onDirective);
    this.registerDirective(componentDirective);

    // Apply global plugins
    if (Uus.globalConfig.plugins) {
      Uus.globalConfig.plugins.forEach((plugin) => this.use(plugin));
    }
    
    // Apply instance-level plugins
    if (config?.plugins) {
      config.plugins.forEach((plugin) => this.use(plugin));
    }
  }

  static config(options: GlobalConfig): void {
    // Validate configuration
    if (options.prefix !== undefined && typeof options.prefix !== 'string') {
      throw new TypeError('Configuration prefix must be a string');
    }
    
    if (options.debug !== undefined && typeof options.debug !== 'boolean') {
      throw new TypeError('Configuration debug must be a boolean');
    }
    
    if (options.onError !== undefined && typeof options.onError !== 'function') {
      throw new TypeError('Configuration onError must be a function');
    }
    
    if (options.plugins !== undefined && !Array.isArray(options.plugins)) {
      throw new TypeError('Configuration plugins must be an array');
    }
    
    Uus.globalConfig = { ...Uus.globalConfig, ...options };
  }
  
  /**
   * Get global memory statistics across all instances
   */
  static getGlobalMemoryStats() {
    return memoryManager.getMemoryStats();
  }
  
  /**
   * Cleanup all UUS instances (emergency cleanup)
   */
  static destroyAll(): void {
    console.warn('🚨 Emergency cleanup: destroying all UUS instances');
    memoryManager.destroy();
  }

  mount(element: HTMLElement | ElementSelector): void {
    try {
      // Validate mount target
      const mountTarget = this.validateMountTarget(element);
      if (mountTarget.type === 'invalid') {
        throw new MountingError(
          element,
          new Error(`Invalid mount target: ${mountTarget.reason}`),
          { target: typeof element === 'string' ? element : 'HTMLElement' }
        );
      }

      const el = mountTarget.type === 'element' ? mountTarget.element : mountTarget.resolved;
      
      // Check if already mounted
      if (this.rootElement) {
        console.warn('UUS instance is already mounted. Unmounting previous element.');
        this.unmount();
      }

      this.rootElement = el;
      
      // Safely compile the element tree
      this.errorHandler.safe(
        () => this.compile(el),
        ErrorCategory.MOUNTING,
        { element: el },
        undefined
      );

      // Start observing DOM changes with error handling
      this.errorHandler.safe(
        () => {
          const observer = observeDOM(el, this);
          this.domObserver = observer;
          
          // Register observer for cleanup
          this.cleanupRegistry.registerObserver(observer);
          
          // Track DOM observer
          this.memoryTracker.track('observer', observer, () => {
            observer.disconnect();
          }, { type: 'mutation', element: el.tagName });
        },
        ErrorCategory.LIFECYCLE,
        { element: el },
        undefined
      );

      if (this.config.debug) {
        console.log(`UUS mounted successfully to:`, el);
      }
    } catch (error) {
      if (error instanceof MountingError) {
        this.errorHandler.handle(error);
        throw error; // Re-throw mounting errors as they're critical
      } else {
        const mountingError = new MountingError(
          element,
          error instanceof Error ? error : new Error(String(error)),
          { originalError: String(error) }
        );
        this.errorHandler.handle(mountingError);
        throw mountingError;
      }
    }
  }

  unmount(): void {
    if (!this.rootElement) return;
    
    if (this.config.debug) {
      console.log(`🧹 Unmounting UUS instance: ${this.instanceId}`);
    }

    // Stop observing DOM
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = undefined;
    }
    
    // Stop performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }

    // Clean up all effects and event listeners
    this.effects.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during effect cleanup:', error);
      }
    });
    this.effects.clear();
    
    // Cleanup all registered resources
    this.cleanupRegistry.cleanup();
    
    // Clear state (will trigger cleanup of reactive proxies)
    this.state = createReactive({}) as ReactiveState;
    this.rootElement = null;
    
    if (this.config.debug) {
      const stats = this.memoryTracker.stats();
      console.log('📊 Memory stats before unmount:', stats);
    }
  }
  
  /**
   * Completely destroy the UUS instance and cleanup all resources
   */
  destroy(): void {
    if (this.isDestroyed) {
      console.warn('UUS instance already destroyed');
      return;
    }
    
    if (this.config.debug) {
      console.log(`💥 Destroying UUS instance: ${this.instanceId}`);
    }
    
    // Unmount if still mounted
    if (this.rootElement) {
      this.unmount();
    }
    
    // Cleanup all memory tracking
    memoryManager.destroy(this.instanceId);
    
    // Mark as destroyed
    this.isDestroyed = true;
    
    if (this.config.debug) {
      console.log(`✅ UUS instance destroyed: ${this.instanceId}`);
    }
  }

  use(plugin: UusPlugin): void {
    // Validate plugin
    if (!plugin.name || typeof plugin.install !== 'function') {
      throw new TypeError('Invalid plugin: must have name and install function');
    }
    
    // Check for duplicate plugins
    if (!this.installedPlugins) {
      this.installedPlugins = new Set<string>();
    }
    
    if (this.installedPlugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already installed`);
      return;
    }
    
    if (this.config.debug) {
      console.log(`Installing plugin: ${plugin.name}`);
    }
    
    try {
      plugin.install(this);
      this.installedPlugins.add(plugin.name);
      
      if (this.config.debug) {
        console.log(`Successfully installed plugin: ${plugin.name}`);
      }
    } catch (error) {
      this.errorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'PLUGIN' as any,
        { pluginName: plugin.name }
      );
      throw error;
    }
  }

  registerDirective<T extends DirectiveBinding = DirectiveBinding>(
    directive: Directive<T>
  ): void;
  registerDirective<T extends DirectiveBinding = DirectiveBinding>(
    name: string,
    directive: Omit<Directive<T>, 'name'>
  ): void;
  registerDirective<T extends DirectiveBinding = DirectiveBinding>(
    nameOrDirective: string | Directive<T>,
    directive?: Omit<Directive<T>, 'name'>
  ): void {
    let finalDirective: Directive<T>;
    
    if (typeof nameOrDirective === 'string') {
      // Called with separate name and directive object
      if (!directive) {
        throw new TypeError('Directive object required when name is provided as string');
      }
      finalDirective = {
        ...directive,
        name: asDirectiveName(nameOrDirective)
      } as Directive<T>;
    } else {
      // Called with complete directive object
      finalDirective = nameOrDirective;
    }
    
    // Validate directive structure
    if (!finalDirective.name || typeof finalDirective.name !== 'string') {
      throw new TypeError('Directive must have a valid name');
    }
    
    if (!finalDirective.bind && !finalDirective.init && !finalDirective.update && !finalDirective.unbind) {
      throw new TypeError('Directive must have at least one lifecycle hook');
    }
    
    this.directives.set(finalDirective.name as DirectiveName, finalDirective as Directive);
    
    if (this.config.debug) {
      console.log(`Registered directive: ${finalDirective.name}`);
    }
  }

  private compile(root: HTMLElement): void {
    try {
      // First pass: collect all state directives with error handling
      const stateElements: Array<{
        el: HTMLElement;
        parsed: ParsedDirective;
      }> = [];

      this.errorHandler.safe(
        () => {
          walkElement(root, (el, parsed) => {
            if (parsed.name === 'state') {
              stateElements.push({ el, parsed });
            }
          });
        },
        ErrorCategory.PARSING,
        { element: root, phase: 'state-collection' },
        undefined
      );

      // Initialize states from top to bottom with error boundaries
      stateElements.forEach(({ el, parsed }) => {
        this.errorHandler.safe(
          () => {
            const directive = this.directives.get(asDirectiveName('state'));
            if (directive?.init) {
              const binding = createBinding(parsed);
              directive.init(el, binding, this);
            }
          },
          ErrorCategory.DIRECTIVE,
          { 
            element: el, 
            directive: 'state',
            expression: parsed.value,
            phase: 'state-initialization' 
          },
          undefined
        );
      });

      // Second pass: bind all other directives with error boundaries
      this.errorHandler.safe(
        () => {
          walkElement(root, (el, parsed) => {
            this.bindDirective(el, parsed);
          });
        },
        ErrorCategory.PARSING,
        { element: root, phase: 'directive-binding' },
        undefined
      );

      if (this.config.debug) {
        console.log(`Compiled ${root.tagName} with ${this.directives.size} available directives`);
      }
    } catch (error) {
      const compileError = new DirectiveError(
        'compile',
        'compilation',
        error instanceof Error ? error : new Error(String(error)),
        { element: root }
      );
      this.errorHandler.handle(compileError);
      throw compileError;
    }
  }

  /**
   * Safely bind a single directive with comprehensive error handling
   */
  private bindDirective(el: HTMLElement, parsed: ParsedDirective): void {
    const directive = this.directives.get(parsed.name);
    if (!directive || parsed.name === 'state') return;

    const context = {
      element: el,
      directive: parsed.name,
      expression: parsed.value,
      arg: parsed.arg,
    };

    // Safely create binding
    const binding = this.errorHandler.safe(
      () => createBinding(parsed),
      ErrorCategory.PARSING,
      context
    );

    if (!binding) return; // Failed to create binding

    // For custom directives, evaluate the value if it's an expression
    if (!this.builtinDirectives.has(parsed.name) && binding.value && typeof binding.value === 'string') {
      const evaluator = createSafeEvaluator(this.state);
      const evaluatedValue = this.errorHandler.safe(
        () => evaluator(asExpressionString(binding.value as string)),
        ErrorCategory.EVALUATION,
        { ...context, phase: 'evaluate-value' },
        binding.value // Use original value as fallback
      );
      // Create a new binding with evaluated value
      const evaluatedBinding = {
        ...binding,
        value: evaluatedValue
      };
      // Use the evaluated binding for the directive
      if (directive.init) {
        this.errorHandler.safe(
          () => directive.init!(el, evaluatedBinding, this),
          ErrorCategory.DIRECTIVE,
          { ...context, phase: 'init' },
          undefined
        );
      }
      if (directive.bind) {
        this.errorHandler.safe(
          () => directive.bind!(el, evaluatedBinding, this),
          ErrorCategory.DIRECTIVE,
          { ...context, phase: 'bind' },
          undefined
        );
      }
      return; // Skip the default binding below
    }

    // Safely initialize directive
    if (directive.init) {
      this.errorHandler.safe(
        () => directive.init!(el, binding, this),
        ErrorCategory.DIRECTIVE,
        { ...context, phase: 'init' },
        undefined
      );
    }

    // Safely bind directive
    if (directive.bind) {
      this.errorHandler.safe(
        () => directive.bind!(el, binding, this),
        ErrorCategory.DIRECTIVE,
        { ...context, phase: 'bind' },
        undefined
      );
    }
  }

  // ============================================================================
  // ENHANCED TYPE SAFETY AND VALIDATION METHODS
  // ============================================================================

  /**
   * Validate mount target with enhanced type safety
   */
  private validateMountTarget(element: HTMLElement | ElementSelector): MountTarget {
    if (typeof element === 'string') {
      // Validate selector format
      if (!element.trim()) {
        return { type: 'invalid', reason: 'Empty selector string' };
      }

      try {
        const resolved = document.querySelector(element);
        if (!resolved) {
          return { type: 'invalid', reason: `Element not found for selector: ${element}` };
        }

        if (!(resolved instanceof HTMLElement)) {
          return { type: 'invalid', reason: 'Selected element is not an HTMLElement' };
        }

        return { 
          type: 'selector', 
          selector: element as ElementSelector, 
          resolved 
        };
      } catch (error) {
        return { 
          type: 'invalid', 
          reason: `Invalid selector: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }

    if (!element) {
      return { type: 'invalid', reason: 'Element is null or undefined' };
    }

    if (!(element instanceof HTMLElement)) {
      return { type: 'invalid', reason: 'Provided element is not an HTMLElement' };
    }

    return { type: 'element', element };
  }

  /**
   * Get installed plugins list
   */
  public getInstalledPlugins(): readonly string[] {
    return this.installedPlugins ? Array.from(this.installedPlugins) : [];
  }

  /**
   * Check if a plugin is installed
   */
  public hasPlugin(name: string): boolean {
    return this.installedPlugins?.has(name) ?? false;
  }

  /**
   * Uninstall a plugin (if it supports uninstallation)
   */
  public async uninstallPlugin(name: string): Promise<boolean> {
    if (!this.installedPlugins?.has(name)) {
      return false;
    }

    // Find the plugin in global config
    const plugin = Uus.globalConfig.plugins?.find(p => p.name === name);
    if (plugin?.uninstall) {
      try {
        await plugin.uninstall(this);
        this.installedPlugins.delete(name);
        
        if (this.config.debug) {
          console.log(`Successfully uninstalled plugin: ${name}`);
        }
        return true;
      } catch (error) {
        this.errorHandler.handleGenericError(
          error instanceof Error ? error : new Error(String(error)),
          'PLUGIN' as any,
          { pluginName: name, operation: 'uninstall' }
        );
        return false;
      }
    }

    // Plugin doesn't support uninstallation
    return false;
  }

  /**
   * Get registered directives with metadata
   */
  public getDirectives(): Record<string, { name: DirectiveName; metadata?: any }> {
    const result: Record<string, { name: DirectiveName; metadata?: any }> = {};
    
    this.directives.forEach((directive, name) => {
      result[name] = {
        name: name as DirectiveName,
        metadata: directive.metadata
      };
    });
    
    return result;
  }

  /**
   * Check if a directive is registered
   */
  public hasDirective(name: string): boolean {
    return this.directives.has(asDirectiveName(name));
  }

  /**
   * Get directive by name with type safety
   */
  public getDirective<T extends DirectiveBinding = DirectiveBinding>(
    name: DirectiveName
  ): Directive<T> | undefined {
    return this.directives.get(name) as Directive<T> | undefined;
  }

  /**
   * Safely update state with validation
   */
  public updateState<K extends keyof UusInstance['state']>(
    key: K,
    value: UusInstance['state'][K]
  ): void {
    try {
      if (typeof key !== 'string' && typeof key !== 'symbol') {
        throw new TypeError('State key must be a string or symbol');
      }

      this.state[key] = value;
      
      if (this.config.debug) {
        console.log(`State updated: ${String(key)}`, value);
      }
    } catch (error) {
      this.errorHandler.handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'STATE' as any,
        { key: String(key), value }
      );
    }
  }

  /**
   * Get state value with type safety
   */
  public getState<T = unknown>(key: string | symbol): T | undefined {
    return this.state[key] as T | undefined;
  }

  /**
   * Check if the instance is mounted
   */
  public isMounted(): boolean {
    return this.rootElement !== null;
  }

  /**
   * Get mount information
   */
  public getMountInfo(): { 
    isMounted: boolean; 
    element?: HTMLElement; 
    tagName?: string; 
    id?: string; 
    className?: string; 
  } {
    return {
      isMounted: this.isMounted(),
      element: this.rootElement ?? undefined,
      tagName: this.rootElement?.tagName,
      id: this.rootElement?.id || undefined,
      className: this.rootElement?.className || undefined
    };
  }
  
  /**
   * Get memory statistics for this instance
   */
  public getMemoryStats() {
    return {
      instance: this.instanceId,
      isDestroyed: this.isDestroyed,
      ...this.memoryTracker.stats()
    };
  }
  
  /**
   * Force cleanup of dead references
   */
  public cleanupDeadReferences(): number {
    return memoryManager.resourceTracker.cleanupDeadRefs();
  }
  
  /**
   * Register a cleanup function for this instance
   */
  public registerCleanup(cleanup: () => void): () => void {
    return this.cleanupRegistry.register(cleanup);
  }
  
  /**
   * Create an abortable operation for this instance
   */
  public createAbortableOperation<T>(
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('UUS instance is destroyed'));
    }
    
    return operation(this.abortController.signal);
  }
}
