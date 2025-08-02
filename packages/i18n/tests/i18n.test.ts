import { describe, it, expect, beforeEach } from 'vitest';
import { I18n } from '../src/i18n';
import type { I18nOptions } from '../src/types';

describe('I18n', () => {
  let i18n: I18n;

  const messages = {
    en: {
      hello: 'Hello',
      welcome: 'Welcome {name}!',
      nested: {
        key: 'Nested value',
      },
      items: {
        0: 'One item',
        1: '{count} items',
      },
    },
    es: {
      hello: 'Hola',
      welcome: '¡Bienvenido {name}!',
      items: {
        0: 'Un artículo',
        1: '{count} artículos',
      },
    },
  };

  beforeEach(async () => {
    i18n = new I18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages,
      detectBrowserLanguage: false,
      storage: undefined, // Disable localStorage to avoid state persistence
    });

    // Ensure we start with English locale
    await i18n.setLocale('en');
  });

  describe('Basic Translation', () => {
    it('should translate simple keys', () => {
      expect(i18n.t('hello')).toBe('Hello');
    });

    it('should translate with interpolation', () => {
      expect(i18n.t('welcome', { name: 'John' })).toBe('Welcome John!');
    });

    it('should handle nested keys', () => {
      expect(i18n.t('nested.key')).toBe('Nested value');
    });

    it('should return key when translation missing', () => {
      expect(i18n.t('missing.key')).toBe('missing.key');
    });

    it('should use fallback locale', async () => {
      await i18n.setLocale('fr'); // Doesn't exist
      expect(i18n.t('hello')).toBe('Hello'); // Falls back to English
    });
  });

  describe('Pluralization', () => {
    it('should handle singular form', () => {
      expect(i18n.tp('items', 1)).toBe('One item');
    });

    it('should handle plural form', () => {
      expect(i18n.tp('items', 5)).toBe('5 items');
    });

    it('should handle zero form', () => {
      expect(i18n.tp('items', 0)).toBe('0 items');
    });

    it('should work with different locales', async () => {
      await i18n.setLocale('es');
      expect(i18n.tp('items', 1)).toBe('Un artículo');
      expect(i18n.tp('items', 5)).toBe('5 artículos');
    });
  });

  describe('Locale Management', () => {
    it('should get current locale', () => {
      expect(i18n.locale).toBe('en');
    });

    it('should set locale', async () => {
      await i18n.setLocale('es');
      expect(i18n.locale).toBe('es');
      expect(i18n.t('hello')).toBe('Hola');
    });

    it('should get available locales', () => {
      expect(i18n.availableLocales).toEqual(['en', 'es']);
    });

    it('should check if translation exists', () => {
      expect(i18n.te('hello')).toBe(true);
      expect(i18n.te('missing')).toBe(false);
    });
  });

  describe('Messages Management', () => {
    it('should set messages for locale', () => {
      i18n.setMessages('fr', { hello: 'Bonjour' });
      expect(i18n.availableLocales).toContain('fr');
    });

    it('should merge messages', () => {
      i18n.mergeMessages('en', { goodbye: 'Goodbye' });
      expect(i18n.t('goodbye')).toBe('Goodbye');
      expect(i18n.t('hello')).toBe('Hello'); // Still exists
    });

    it('should get messages for locale', () => {
      const enMessages = i18n.getMessages('en');
      expect(enMessages.hello).toBe('Hello');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates', () => {
      const date = new Date('2024-01-15');
      const formatted = i18n.d(date);
      expect(formatted).toMatch(/2024/);
    });

    it('should format dates with custom format', () => {
      const i18nWithFormats = new I18n({
        locale: 'en',
        dateTimeFormats: {
          short: { year: 'numeric', month: 'short', day: 'numeric' },
        },
      });

      const date = new Date('2024-01-15');
      const formatted = i18nWithFormats.d(date, 'short');
      expect(formatted).toMatch(/Jan.*15.*2024/);
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers', () => {
      const formatted = i18n.n(1234.56);
      expect(formatted).toMatch(/1,?234/);
    });

    it('should format numbers with custom format', () => {
      const i18nWithFormats = new I18n({
        locale: 'en',
        numberFormats: {
          currency: { style: 'currency', currency: 'USD' },
        },
      });

      const formatted = i18nWithFormats.n(1234.56, 'currency');
      expect(formatted).toMatch(/\$1,?234\.56/);
    });
  });

  describe('Custom Missing Handler', () => {
    it('should use custom missing handler', () => {
      const customI18n = new I18n({
        locale: 'en',
        messages: { en: {} },
        missingHandler: (locale, key, fallback) => `[${key}]`,
      });

      expect(customI18n.t('missing')).toBe('[missing]');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML by default', () => {
      const i18nWithHtml = new I18n({
        locale: 'en',
        messages: {
          en: {
            html: 'Hello <script>alert("xss")</script>',
          },
        },
      });

      const result = i18nWithHtml.t('html');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should not escape HTML when disabled', () => {
      const i18nWithoutEscape = new I18n({
        locale: 'en',
        escapeHtml: false,
        messages: {
          en: {
            html: 'Hello <b>world</b>',
          },
        },
      });

      const result = i18nWithoutEscape.t('html');
      expect(result).toBe('Hello <b>world</b>');
    });
  });

  describe('Async Loading', () => {
    it('should load messages asynchronously', async () => {
      const asyncI18n = new I18n({
        locale: 'en',
        loadMessages: async (locale) => {
          if (locale === 'fr') {
            return { hello: 'Bonjour' };
          }
          return {};
        },
      });

      await asyncI18n.loadMessages('fr');
      await asyncI18n.setLocale('fr');

      expect(asyncI18n.t('hello')).toBe('Bonjour');
    });
  });
});
