import type { Uus } from '@uusjs/core';

export type LocaleMessages = Record<string, any>;

export type TranslationMessages = Record<string, LocaleMessages>;

export interface I18nOptions {
  /**
   * Default locale
   */
  locale?: string;
  
  /**
   * Fallback locale when translation is missing
   */
  fallbackLocale?: string;
  
  /**
   * Translation messages
   */
  messages?: TranslationMessages;
  
  /**
   * Missing translation handler
   */
  missingHandler?: (locale: string, key: string, fallback?: string) => string;
  
  /**
   * Pluralization rules
   */
  pluralizationRules?: Record<string, (count: number) => number>;
  
  /**
   * Date/time formats
   */
  dateTimeFormats?: Record<string, Intl.DateTimeFormatOptions>;
  
  /**
   * Number formats
   */
  numberFormats?: Record<string, Intl.NumberFormatOptions>;
  
  /**
   * Lazy loading function for messages
   */
  loadMessages?: (locale: string) => Promise<LocaleMessages>;
  
  /**
   * Storage for persisting locale
   */
  storage?: Storage;
  
  /**
   * Storage key for locale persistence
   */
  storageKey?: string;
  
  /**
   * Auto-detect locale from browser
   */
  detectBrowserLanguage?: boolean;
  
  /**
   * Escape HTML in translations
   */
  escapeHtml?: boolean;
}

export interface I18nInstance {
  /**
   * Current locale
   */
  locale: string;
  
  /**
   * Available locales
   */
  availableLocales: string[];
  
  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, any>): string;
  
  /**
   * Translate with pluralization
   */
  tp(key: string, count: number, params?: Record<string, any>): string;
  
  /**
   * Check if translation exists
   */
  te(key: string, locale?: string): boolean;
  
  /**
   * Format date
   */
  d(date: Date | number, format?: string): string;
  
  /**
   * Format number
   */
  n(number: number, format?: string): string;
  
  /**
   * Set locale
   */
  setLocale(locale: string): Promise<void>;
  
  /**
   * Add messages for a locale
   */
  setMessages(locale: string, messages: LocaleMessages): void;
  
  /**
   * Merge messages for a locale
   */
  mergeMessages(locale: string, messages: LocaleMessages): void;
  
  /**
   * Get messages for a locale
   */
  getMessages(locale?: string): LocaleMessages;
  
  /**
   * Load messages for a locale
   */
  loadMessages(locale: string): Promise<void>;
}

export interface I18nPlugin {
  install(app: Uus): void;
  i18n: I18nInstance;
}

export interface TranslationResult {
  value: string;
  locale: string;
  key: string;
  fallback?: boolean;
}