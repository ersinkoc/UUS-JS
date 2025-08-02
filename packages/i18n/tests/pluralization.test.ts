import { describe, it, expect } from 'vitest';
import { getPluralizationRule, getPluralForm, hasPluralizationRules } from '../src/pluralization';

describe('Pluralization', () => {
  describe('English Pluralization', () => {
    const rule = getPluralizationRule('en');
    
    it('should return 0 for singular', () => {
      expect(rule(1)).toBe(0);
    });
    
    it('should return 1 for plural', () => {
      expect(rule(0)).toBe(1);
      expect(rule(2)).toBe(1);
      expect(rule(5)).toBe(1);
      expect(rule(100)).toBe(1);
    });
  });
  
  describe('Russian Pluralization', () => {
    const rule = getPluralizationRule('ru');
    
    it('should handle form 0 (1, 21, 31, ...)', () => {
      expect(rule(1)).toBe(0);
      expect(rule(21)).toBe(0);
      expect(rule(31)).toBe(0);
      expect(rule(101)).toBe(0);
    });
    
    it('should handle form 1 (2-4, 22-24, ...)', () => {
      expect(rule(2)).toBe(1);
      expect(rule(3)).toBe(1);
      expect(rule(4)).toBe(1);
      expect(rule(22)).toBe(1);
      expect(rule(23)).toBe(1);
      expect(rule(24)).toBe(1);
    });
    
    it('should handle form 2 (0, 5-20, 25-30, ...)', () => {
      expect(rule(0)).toBe(2);
      expect(rule(5)).toBe(2);
      expect(rule(10)).toBe(2);
      expect(rule(11)).toBe(2); // Special case
      expect(rule(15)).toBe(2);
      expect(rule(20)).toBe(2);
      expect(rule(25)).toBe(2);
    });
    
    it('should handle teens correctly', () => {
      expect(rule(11)).toBe(2); // Not 0
      expect(rule(12)).toBe(2); // Not 1
      expect(rule(13)).toBe(2); // Not 1
      expect(rule(14)).toBe(2); // Not 1
    });
  });
  
  describe('Arabic Pluralization', () => {
    const rule = getPluralizationRule('ar');
    
    it('should handle zero', () => {
      expect(rule(0)).toBe(0);
    });
    
    it('should handle one', () => {
      expect(rule(1)).toBe(1);
    });
    
    it('should handle two', () => {
      expect(rule(2)).toBe(2);
    });
    
    it('should handle few (3-10)', () => {
      expect(rule(3)).toBe(3);
      expect(rule(10)).toBe(3);
    });
    
    it('should handle many (11-99)', () => {
      expect(rule(11)).toBe(4);
      expect(rule(99)).toBe(4);
    });
    
    it('should handle other (100+)', () => {
      expect(rule(100)).toBe(5);
      expect(rule(101)).toBe(5);
      expect(rule(102)).toBe(5);
    });
  });
  
  describe('Chinese Pluralization', () => {
    const rule = getPluralizationRule('zh');
    
    it('should always return 0 (no pluralization)', () => {
      expect(rule(0)).toBe(0);
      expect(rule(1)).toBe(0);
      expect(rule(2)).toBe(0);
      expect(rule(100)).toBe(0);
    });
  });
  
  describe('Polish Pluralization', () => {
    const rule = getPluralizationRule('pl');
    
    it('should handle singular', () => {
      expect(rule(1)).toBe(0);
    });
    
    it('should handle few', () => {
      expect(rule(2)).toBe(1);
      expect(rule(3)).toBe(1);
      expect(rule(4)).toBe(1);
      expect(rule(22)).toBe(1);
      expect(rule(23)).toBe(1);
      expect(rule(24)).toBe(1);
    });
    
    it('should handle many', () => {
      expect(rule(0)).toBe(2);
      expect(rule(5)).toBe(2);
      expect(rule(11)).toBe(2);
      expect(rule(12)).toBe(2);
      expect(rule(15)).toBe(2);
    });
  });
  
  describe('getPluralForm', () => {
    it('should get correct plural form for locale', () => {
      expect(getPluralForm(1, 'en')).toBe(0);
      expect(getPluralForm(2, 'en')).toBe(1);
      
      expect(getPluralForm(1, 'ru')).toBe(0);
      expect(getPluralForm(2, 'ru')).toBe(1);
      expect(getPluralForm(5, 'ru')).toBe(2);
    });
    
    it('should handle locale with region', () => {
      expect(getPluralForm(1, 'en-US')).toBe(0);
      expect(getPluralForm(2, 'en-GB')).toBe(1);
    });
  });
  
  describe('hasPluralizationRules', () => {
    it('should return true for supported locales', () => {
      expect(hasPluralizationRules('en')).toBe(true);
      expect(hasPluralizationRules('ru')).toBe(true);
      expect(hasPluralizationRules('ar')).toBe(true);
      expect(hasPluralizationRules('zh')).toBe(true);
    });
    
    it('should return false for unsupported locales', () => {
      expect(hasPluralizationRules('xyz')).toBe(false);
    });
    
    it('should handle locale with region', () => {
      expect(hasPluralizationRules('en-US')).toBe(true);
      expect(hasPluralizationRules('ru-RU')).toBe(true);
    });
  });
});