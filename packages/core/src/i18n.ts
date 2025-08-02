/**
 * UUS.js Internationalization (i18n) Support
 * Provides multi-language support for UUS applications
 */

import { createReactive, effect } from './reactive';
import { UusPlugin } from './types';
import { ValidationError, ErrorSeverity, ErrorCategory, globalErrorHandler } from './errors';
import { asDirectiveName } from './type-guards';

export interface I18nConfig {
  defaultLocale: string;
  fallbackLocale?: string;
  messages: Record<string, Record<string, any>>;
  numberFormats?: Record<string, Intl.NumberFormatOptions>;
  dateFormats?: Record<string, Intl.DateTimeFormatOptions>;
  detectBrowserLocale?: boolean;
  preserveDirectiveContent?: boolean;
}

export interface I18nInstance {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, Record<string, any>>;
  numberFormats: Record<string, Intl.NumberFormatOptions>;
  dateFormats: Record<string, Intl.DateTimeFormatOptions>;
  t(key: string, params?: Record<string, any>): string;
  tc(key: string, count: number, params?: Record<string, any>): string;
  n(value: number, format?: string): string;
  d(value: Date | number, format?: string): string;
  setLocale(locale: string): void;
  addMessages(locale: string, messages: Record<string, any>): void;
  hasLocale(locale: string): boolean;
}

class I18n implements I18nInstance {
  private state: {
    locale: string;
    fallbackLocale: string;
    messages: Record<string, Record<string, any>>;
    numberFormats: Record<string, Intl.NumberFormatOptions>;
    dateFormats: Record<string, Intl.DateTimeFormatOptions>;
  };

  constructor(config: I18nConfig) {
    // Validate config
    if (!config.defaultLocale) {
      throw new ValidationError(
        'defaultLocale',
        config.defaultLocale,
        'Default locale is required',
        { config }
      );
    }

    if (!config.messages || Object.keys(config.messages).length === 0) {
      throw new ValidationError(
        'messages',
        config.messages,
        'At least one locale with messages is required',
        { config }
      );
    }

    // Initialize reactive state
    this.state = createReactive({
      locale: config.detectBrowserLocale ? this.detectBrowserLocale() : config.defaultLocale,
      fallbackLocale: config.fallbackLocale || config.defaultLocale,
      messages: config.messages || {},
      numberFormats: config.numberFormats || {},
      dateFormats: config.dateFormats || {}
    });

    // Ensure current locale has messages
    if (!this.state.messages[this.state.locale]) {
      this.state.locale = config.defaultLocale;
    }
  }

  get locale(): string {
    return this.state.locale;
  }

  get fallbackLocale(): string {
    return this.state.fallbackLocale;
  }

  get messages(): Record<string, Record<string, any>> {
    return this.state.messages;
  }

  get numberFormats(): Record<string, Intl.NumberFormatOptions> {
    return this.state.numberFormats;
  }

  get dateFormats(): Record<string, Intl.DateTimeFormatOptions> {
    return this.state.dateFormats;
  }

  /**
   * Translate a message key
   */
  t(key: string, params?: Record<string, any>): string {
    const message = this.getMessage(key);
    if (!message) return key;

    return this.interpolate(message, params);
  }

  /**
   * Translate with pluralization
   */
  tc(key: string, count: number, params?: Record<string, any>): string {
    const message = this.getMessage(key);
    if (!message) return key;

    // Handle pluralization
    if (typeof message === 'object' && message !== null) {
      let pluralKey: string;
      
      if (count === 0 && 'zero' in message) {
        pluralKey = 'zero';
      } else if (count === 1 && 'one' in message) {
        pluralKey = 'one';
      } else if (count === 2 && 'two' in message) {
        pluralKey = 'two';
      } else if (count > 2 && count < 5 && 'few' in message) {
        pluralKey = 'few';
      } else if ('many' in message) {
        pluralKey = 'many';
      } else {
        pluralKey = 'other';
      }

      const pluralMessage = message[pluralKey] || message.other || key;
      return this.interpolate(pluralMessage, { count, ...params });
    }

    return this.interpolate(message, { count, ...params });
  }

  /**
   * Format a number
   */
  n(value: number, format?: string): string {
    const options = format ? this.state.numberFormats[format] : undefined;
    
    try {
      return new Intl.NumberFormat(this.state.locale, options).format(value);
    } catch (error) {
      console.warn(`Failed to format number: ${error}`);
      return String(value);
    }
  }

  /**
   * Format a date
   */
  d(value: Date | number, format?: string): string {
    const date = value instanceof Date ? value : new Date(value);
    const options = format ? this.state.dateFormats[format] : undefined;
    
    try {
      return new Intl.DateTimeFormat(this.state.locale, options).format(date);
    } catch (error) {
      console.warn(`Failed to format date: ${error}`);
      return date.toString();
    }
  }

  /**
   * Set the current locale
   */
  setLocale(locale: string): void {
    if (!this.state.messages[locale]) {
      throw new ValidationError(
        'locale',
        locale,
        `Locale "${locale}" not found`,
        { locale, availableLocales: Object.keys(this.state.messages) }
      );
    }

    // Update locale using reactive system properly
    (this.state as any).locale = locale;
  }

  /**
   * Add messages for a locale
   */
  addMessages(locale: string, messages: Record<string, any>): void {
    if (!this.state.messages[locale]) {
      this.state.messages[locale] = {};
    }

    // Deep merge messages
    this.deepMerge(this.state.messages[locale], messages);
  }

  /**
   * Check if locale exists
   */
  hasLocale(locale: string): boolean {
    return locale in this.state.messages;
  }

  /**
   * Get message by key
   */
  private getMessage(key: string): any {
    const keys = key.split('.');
    let message: any = this.state.messages[this.state.locale];

    // Try current locale first
    for (const k of keys) {
      if (message && typeof message === 'object' && k in message) {
        message = message[k];
      } else {
        message = null;
        break;
      }
    }

    // Fallback to fallback locale
    if (!message && this.state.locale !== this.state.fallbackLocale) {
      message = this.state.messages[this.state.fallbackLocale];
      for (const k of keys) {
        if (message && typeof message === 'object' && k in message) {
          message = message[k];
        } else {
          return null;
        }
      }
    }

    return message;
  }

  /**
   * Interpolate parameters into message
   */
  private interpolate(message: string, params?: Record<string, any>): string {
    if (!params || typeof params !== 'object') return message;

    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return key in params ? String(params[key]) : match;
    });
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * Detect browser locale
   */
  private detectBrowserLocale(): string {
    if (typeof window === 'undefined') return 'en';

    const browserLocale = window.navigator.language || 
                         (window.navigator as any).userLanguage || 
                         'en';

    // Return just the language code (e.g., 'en' from 'en-US')
    return browserLocale.split('-')[0];
  }
}

/**
 * i18n Plugin for UUS.js
 */
export const i18nPlugin: UusPlugin = {
  name: 'i18n',
  
  install(app) {
    let i18nInstance: I18n | null = null;

    // Add $i18n property to app
    Object.defineProperty(app, '$i18n', {
      get() {
        if (!i18nInstance) {
          throw new Error('i18n not initialized. Call app.setupI18n(config) first.');
        }
        return i18nInstance;
      }
    });

    // Add setupI18n method
    (app as any).setupI18n = (config: I18nConfig) => {
      i18nInstance = new I18n(config);
      
      // Make i18n reactive in state
      (app.state as any).$i18n = i18nInstance;
      
      return i18nInstance;
    };

    // Register i18n directives
    app.registerDirective({
      name: asDirectiveName('t'),
      bind(el: HTMLElement, binding: any, uus: any) {
        const updateText = () => {
          const i18n = (uus as any).$i18n as I18n;
          if (!i18n) return;

          try {
            const key = binding.expression || el.getAttribute('uus-t') || '';
            let params: Record<string, any> | undefined;
            
            if (binding.arg) {
              // If there's an arg (like :name="name"), create params object
              params = { [binding.arg]: binding.value };
            } else if (binding.value && typeof binding.value === 'object') {
              // If value is already an object, use it as params
              params = binding.value;
            }
            // If value is a string or primitive, don't use it as params
            
            el.textContent = i18n.t(key, params);
          } catch (error) {
            globalErrorHandler.handleGenericError(
              error instanceof Error ? error : new Error(String(error)),
              ErrorCategory.DIRECTIVE,
              { element: el, binding }
            );
          }
        };

        // Update on locale change
        const cleanup = effect(updateText);
        
        // Store cleanup
        const cleanups = uus.cleanups.get(el) || new Set();
        cleanups.add(cleanup);
        uus.cleanups.set(el, cleanups);
      },
      unbind(el: HTMLElement, _: any, uus: any) {
        const cleanups = uus.cleanups.get(el);
        if (cleanups) {
          cleanups.forEach((cleanup: any) => cleanup());
          uus.cleanups.delete(el);
        }
      }
    });

    // Register i18n-html directive
    app.registerDirective({
      name: asDirectiveName('t-html'),
      bind(el: HTMLElement, binding: any, uus: any) {
        const updateHtml = () => {
          const i18n = (uus as any).$i18n as I18n;
          if (!i18n) return;

          try {
            const key = binding.expression || el.getAttribute('uus-t-html') || '';
            const params = binding.arg ? { [binding.arg]: binding.value } : binding.value;
            
            el.innerHTML = i18n.t(key, params);
          } catch (error) {
            globalErrorHandler.handleGenericError(
              error instanceof Error ? error : new Error(String(error)),
              ErrorCategory.DIRECTIVE,
              { element: el, binding }
            );
          }
        };

        // Update on locale change
        const cleanup = effect(updateHtml);
        
        // Store cleanup
        const cleanups = uus.cleanups.get(el) || new Set();
        cleanups.add(cleanup);
        uus.cleanups.set(el, cleanups);
      },
      unbind(el: HTMLElement, _: any, uus: any) {
        const cleanups = uus.cleanups.get(el);
        if (cleanups) {
          cleanups.forEach((cleanup: any) => cleanup());
          uus.cleanups.delete(el);
        }
      }
    });
  }
};

// Export types for module augmentation
declare module './types' {
  interface Uus {
    $i18n?: I18nInstance;
    setupI18n(config: I18nConfig): I18nInstance;
  }
}

export { I18n };