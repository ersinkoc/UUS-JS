import { createReactive } from '@uusjs/core';
import type { 
  I18nOptions, 
  I18nInstance, 
  LocaleMessages, 
  TranslationMessages,
  TranslationResult
} from './types';
import { 
  getNestedProperty, 
  setNestedProperty, 
  deepMerge, 
  interpolate, 
  escapeHtml,
  detectBrowserLanguage,
  normalizeLocale
} from './utils';
import { getPluralForm } from './pluralization';

export class I18n implements I18nInstance {
  private options: Required<I18nOptions>;
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private state: {
    locale: string;
    messages: TranslationMessages;
  };

  constructor(options: I18nOptions = {}) {
    // Set default options
    this.options = {
      locale: 'en',
      fallbackLocale: 'en',
      messages: {},
      missingHandler: (locale, key, fallback) => fallback || key,
      pluralizationRules: {},
      dateTimeFormats: {},
      numberFormats: {},
      loadMessages: undefined,
      storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
      storageKey: 'uus-i18n-locale',
      detectBrowserLanguage: true,
      escapeHtml: true,
      ...options
    } as Required<I18nOptions>;

    // Initialize state
    this.state = createReactive({
      locale: this.getInitialLocale(),
      messages: { ...this.options.messages }
    });

    // Set initial locale if different from options
    if (this.state.locale !== this.options.locale) {
      this.options.locale = this.state.locale;
    }
  }

  get locale(): string {
    return this.state.locale;
  }

  get availableLocales(): string[] {
    return Object.keys(this.state.messages);
  }

  /**
   * Translate a key
   */
  t(key: string, params: Record<string, any> = {}): string {
    const result = this.getTranslation(key, this.state.locale, params);
    return result.value;
  }

  /**
   * Translate with pluralization
   */
  tp(key: string, count: number, params: Record<string, any> = {}): string {
    const pluralKey = this.getPluralKey(key, count, this.state.locale);
    const allParams = { ...params, count };
    const result = this.getTranslation(pluralKey, this.state.locale, allParams);
    return result.value;
  }

  /**
   * Check if translation exists
   */
  te(key: string, locale?: string): boolean {
    const targetLocale = locale || this.state.locale;
    const messages = this.state.messages[targetLocale];
    if (!messages) return false;

    // Handle special plural key format: key[index]
    const pluralMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (pluralMatch) {
      const [, baseKey, index] = pluralMatch;
      const baseMessage = getNestedProperty(messages, baseKey);
      if (baseMessage && typeof baseMessage === 'object') {
        return baseMessage[parseInt(index)] !== undefined;
      }
    }

    const value = getNestedProperty(messages, key);
    return value !== undefined;
  }

  /**
   * Format date
   */
  d(date: Date | number, format?: string): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    
    if (format && this.options.dateTimeFormats[format]) {
      return new Intl.DateTimeFormat(this.state.locale, this.options.dateTimeFormats[format])
        .format(dateObj);
    }

    return new Intl.DateTimeFormat(this.state.locale).format(dateObj);
  }

  /**
   * Format number
   */
  n(number: number, format?: string): string {
    if (format && this.options.numberFormats[format]) {
      return new Intl.NumberFormat(this.state.locale, this.options.numberFormats[format])
        .format(number);
    }

    return new Intl.NumberFormat(this.state.locale).format(number);
  }

  /**
   * Set locale
   */
  async setLocale(locale: string): Promise<void> {
    if (locale === this.state.locale) return;

    // Load messages if needed
    if (!this.state.messages[locale] && this.options.loadMessages) {
      await this.loadMessages(locale);
    }

    this.state.locale = locale;

    // Persist to storage
    if (this.options.storage) {
      try {
        this.options.storage.setItem(this.options.storageKey, locale);
      } catch (error) {
        console.warn('Failed to persist locale to storage:', error);
      }
    }
  }

  /**
   * Set messages for a locale
   */
  setMessages(locale: string, messages: LocaleMessages): void {
    this.state.messages[locale] = { ...messages };
  }

  /**
   * Merge messages for a locale
   */
  mergeMessages(locale: string, messages: LocaleMessages): void {
    if (!this.state.messages[locale]) {
      this.state.messages[locale] = {};
    }
    this.state.messages[locale] = deepMerge(this.state.messages[locale], messages);
  }

  /**
   * Get messages for a locale
   */
  getMessages(locale?: string): LocaleMessages {
    const targetLocale = locale || this.state.locale;
    return this.state.messages[targetLocale] || {};
  }

  /**
   * Load messages for a locale
   */
  async loadMessages(locale: string): Promise<void> {
    if (!this.options.loadMessages) {
      throw new Error('loadMessages function not provided');
    }

    // Check if already loading
    if (this.loadingPromises.has(locale)) {
      return this.loadingPromises.get(locale);
    }

    // Start loading
    const loadPromise = this.options.loadMessages(locale)
      .then(messages => {
        this.setMessages(locale, messages);
        this.loadingPromises.delete(locale);
      })
      .catch(error => {
        this.loadingPromises.delete(locale);
        throw error;
      });

    this.loadingPromises.set(locale, loadPromise);
    return loadPromise;
  }

  /**
   * Get translation with fallback logic
   */
  private getTranslation(key: string, locale: string, params: Record<string, any> = {}): TranslationResult {
    // Try current locale
    let value = this.getTranslationValue(key, locale);
    if (value !== undefined) {
      const processed = this.processTranslation(value, params);
      return {
        value: processed,
        locale,
        key
      };
    }

    // Try fallback locale
    if (locale !== this.options.fallbackLocale) {
      value = this.getTranslationValue(key, this.options.fallbackLocale);
      if (value !== undefined) {
        const processed = this.processTranslation(value, params);
        return {
          value: processed,
          locale: this.options.fallbackLocale,
          key,
          fallback: true
        };
      }
    }

    // Use missing handler
    const fallback = this.options.missingHandler(locale, key, key);
    return {
      value: fallback,
      locale,
      key,
      fallback: true
    };
  }

  /**
   * Get raw translation value
   */
  private getTranslationValue(key: string, locale: string): any {
    const messages = this.state.messages[locale];
    if (!messages) return undefined;

    // Handle special plural key format: key[index]
    const pluralMatch = key.match(/^(.+)\[(\d+)\]$/);
    if (pluralMatch) {
      const [, baseKey, index] = pluralMatch;
      const baseMessage = getNestedProperty(messages, baseKey);
      if (baseMessage && typeof baseMessage === 'object') {
        return baseMessage[parseInt(index)];
      }
    }

    return getNestedProperty(messages, key);
  }

  /**
   * Process translation with interpolation and escaping
   */
  private processTranslation(value: any, params: Record<string, any>): string {
    if (typeof value !== 'string') {
      if (value === null || value === undefined) {
        return '';
      }
      
      // If it's an object with numeric keys (pluralization array), 
      // this should have been handled earlier in getTranslation
      if (typeof value === 'object' && !Array.isArray(value)) {
        console.warn('processTranslation received object instead of string:', value);
        return JSON.stringify(value);
      }
      
      return String(value);
    }

    let processed = interpolate(value, params);

    if (this.options.escapeHtml) {
      processed = escapeHtml(processed);
    }

    return processed;
  }

  /**
   * Get plural key for count and locale
   */
  private getPluralKey(key: string, count: number, locale: string): string {
    const pluralIndex = getPluralForm(count, locale);
    
    // Try specific plural forms first
    const pluralKeys = [
      `${key}.${pluralIndex}`,
      `${key}_${pluralIndex}`,
      `${key}[${pluralIndex}]`
    ];

    for (const pluralKey of pluralKeys) {
      if (this.te(pluralKey, locale)) {
        return pluralKey;
      }
    }
    
    // Check if the key exists as a nested object with plural forms
    const baseMessage = this.getTranslationValue(key, locale);
    if (baseMessage && typeof baseMessage === 'object' && baseMessage[pluralIndex] !== undefined) {
      // Return a special key that will be handled in getTranslation
      return `${key}[${pluralIndex}]`;
    }

    // Fallback to original key
    return key;
  }

  /**
   * Get initial locale
   */
  private getInitialLocale(): string {
    // Check storage first
    if (this.options.storage) {
      try {
        const stored = this.options.storage.getItem(this.options.storageKey);
        if (stored && this.isValidLocale(stored)) {
          return stored;
        }
      } catch (error) {
        console.warn('Failed to read locale from storage:', error);
      }
    }

    // Auto-detect browser language
    if (this.options.detectBrowserLanguage) {
      const browserLang = detectBrowserLanguage();
      const normalized = normalizeLocale(browserLang);
      
      // Check if we have messages for this locale
      if (this.options.messages[normalized] || this.options.messages[browserLang]) {
        return this.options.messages[browserLang] ? browserLang : normalized;
      }
    }

    return this.options.locale;
  }

  /**
   * Check if locale is valid
   */
  private isValidLocale(locale: string): boolean {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
  }
}