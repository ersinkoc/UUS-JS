import { describe, it, expect } from 'vitest';
import {
  getNestedProperty,
  setNestedProperty,
  deepMerge,
  interpolate,
  escapeHtml,
  detectBrowserLanguage,
  normalizeLocale,
  isRTL,
} from '../src/utils';

describe('Utils', () => {
  describe('getNestedProperty', () => {
    const obj = {
      a: {
        b: {
          c: 'value',
        },
      },
      array: [1, 2, 3],
    };

    it('should get nested property', () => {
      expect(getNestedProperty(obj, 'a.b.c')).toBe('value');
    });

    it('should return undefined for missing property', () => {
      expect(getNestedProperty(obj, 'a.b.d')).toBeUndefined();
    });

    it('should handle top-level properties', () => {
      expect(getNestedProperty(obj, 'array')).toEqual([1, 2, 3]);
    });
  });

  describe('setNestedProperty', () => {
    it('should set nested property', () => {
      const obj = {};
      setNestedProperty(obj, 'a.b.c', 'value');
      expect(obj).toEqual({ a: { b: { c: 'value' } } });
    });

    it('should overwrite existing property', () => {
      const obj = { a: { b: { c: 'old' } } };
      setNestedProperty(obj, 'a.b.c', 'new');
      expect(obj.a.b.c).toBe('new');
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const target = { a: { b: 1 }, c: 2 };
      const source = { a: { d: 3 }, e: 4 };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: { b: 1, d: 3 },
        c: 2,
        e: 4,
      });
    });

    it('should overwrite primitive values', () => {
      const target = { a: 1 };
      const source = { a: 2 };

      const result = deepMerge(target, source);

      expect(result.a).toBe(2);
    });

    it('should handle arrays', () => {
      const target = { a: [1, 2] };
      const source = { a: [3, 4] };

      const result = deepMerge(target, source);

      expect(result.a).toEqual([3, 4]);
    });
  });

  describe('interpolate', () => {
    it('should interpolate simple placeholders', () => {
      const template = 'Hello {name}!';
      const params = { name: 'John' };

      expect(interpolate(template, params)).toBe('Hello John!');
    });

    it('should interpolate multiple placeholders', () => {
      const template = '{greeting} {name}, you have {count} messages';
      const params = { greeting: 'Hi', name: 'John', count: 5 };

      expect(interpolate(template, params)).toBe(
        'Hi John, you have 5 messages'
      );
    });

    it('should handle nested properties', () => {
      const template = 'Hello {user.name}!';
      const params = { user: { name: 'John' } };

      expect(interpolate(template, params)).toBe('Hello John!');
    });

    it('should leave missing placeholders unchanged', () => {
      const template = 'Hello {name}!';
      const params = {};

      expect(interpolate(template, params)).toBe('Hello {name}!');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      const html = '<script>alert("xss")</script>';
      expect(escapeHtml(html)).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape all dangerous characters', () => {
      const input = '& < > " \'';
      const expected = '&amp; &lt; &gt; &quot; &#39;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should leave safe text unchanged', () => {
      const safe = 'Hello world 123';
      expect(escapeHtml(safe)).toBe(safe);
    });
  });

  describe('normalizeLocale', () => {
    it('should normalize locale codes', () => {
      expect(normalizeLocale('en-US')).toBe('en');
      expect(normalizeLocale('es-ES')).toBe('es');
      expect(normalizeLocale('zh-CN')).toBe('zh');
    });

    it('should handle already normalized locales', () => {
      expect(normalizeLocale('en')).toBe('en');
      expect(normalizeLocale('fr')).toBe('fr');
    });

    it('should handle case sensitivity', () => {
      expect(normalizeLocale('EN-US')).toBe('en');
      expect(normalizeLocale('Es-ES')).toBe('es');
    });
  });

  describe('isRTL', () => {
    it('should detect RTL languages', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('he')).toBe(true);
      expect(isRTL('fa')).toBe(true);
      expect(isRTL('ur')).toBe(true);
    });

    it('should detect LTR languages', () => {
      expect(isRTL('en')).toBe(false);
      expect(isRTL('es')).toBe(false);
      expect(isRTL('fr')).toBe(false);
      expect(isRTL('de')).toBe(false);
    });

    it('should handle locale codes with regions', () => {
      expect(isRTL('ar-SA')).toBe(true);
      expect(isRTL('en-US')).toBe(false);
    });
  });
});
