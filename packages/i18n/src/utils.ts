import type { LocaleMessages } from './types';

/**
 * Get nested property from object using dot notation
 */
export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Set nested property in object using dot notation
 */
export function setNestedProperty(obj: any, path: string, value: any): void {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const keys = path.split('.');

  // Validate that no dangerous keys are present in the path
  if (keys.some(k => dangerousKeys.includes(k))) {
    throw new Error('Invalid property path: cannot set prototype pollution keys');
  }

  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Deep merge two objects
 */
export function deepMerge(target: any, source: any): any {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const result = { ...target };

  for (const key in source) {
    // Skip dangerous keys to prevent prototype pollution
    if (dangerousKeys.includes(key)) {
      continue;
    }

    // Only process own properties of source
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Replace placeholders in string with values
 */
export function interpolate(
  template: string,
  params: Record<string, any> = {}
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = getNestedProperty(params, key.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Escape HTML characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Detect browser language
 */
export function detectBrowserLanguage(): string {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const language = navigator.language || (navigator as any).userLanguage;
  return language ? language.split('-')[0] : 'en';
}

/**
 * Normalize locale code (e.g., 'en-US' -> 'en')
 */
export function normalizeLocale(locale: string): string {
  return locale.toLowerCase().split('-')[0];
}

/**
 * Check if locale is RTL (Right-to-Left)
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur', 'ku', 'dv'];
  return rtlLocales.includes(normalizeLocale(locale));
}

/**
 * Get all available locales from messages
 */
export function getAvailableLocales(
  messages: Record<string, LocaleMessages>
): string[] {
  return Object.keys(messages);
}

/**
 * Validate locale format
 */
export function isValidLocale(locale: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
}

/**
 * Parse Accept-Language header
 */
export function parseAcceptLanguage(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(',')
    .map((lang) => {
      const parts = lang.trim().split(';');
      const locale = parts[0];
      const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1;
      return { locale, quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.locale);
}

/**
 * Format template string with named parameters
 */
export function formatTemplate(
  template: string,
  params: Record<string, any>
): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, expression) => {
    try {
      // Simple expression evaluation for basic operations
      const value = evaluateExpression(expression, params);
      return value !== undefined ? String(value) : match;
    } catch {
      return match;
    }
  });
}

/**
 * Simple expression evaluator for template strings
 */
function evaluateExpression(
  expression: string,
  params: Record<string, any>
): any {
  const trimmed = expression.trim();

  // Handle simple property access
  if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(trimmed)) {
    return getNestedProperty(params, trimmed);
  }

  // Handle ternary operator
  const ternaryMatch = trimmed.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
  if (ternaryMatch) {
    const [, condition, trueValue, falseValue] = ternaryMatch;
    const conditionResult = evaluateExpression(condition, params);
    return conditionResult
      ? evaluateExpression(trueValue, params)
      : evaluateExpression(falseValue, params);
  }

  // Handle comparison operators
  const comparisonMatch = trimmed.match(
    /^(.+?)\s*(===|!==|==|!=|<=|>=|<|>)\s*(.+)$/
  );
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    const leftValue = evaluateExpression(left, params);
    const rightValue = evaluateExpression(right, params);

    switch (operator) {
      case '===':
        return leftValue === rightValue;
      case '!==':
        return leftValue !== rightValue;
      case '==':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '<=':
        return leftValue <= rightValue;
      case '>=':
        return leftValue >= rightValue;
      case '<':
        return leftValue < rightValue;
      case '>':
        return leftValue > rightValue;
    }
  }

  // Handle string literals
  if (/^['"`].*['"`]$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }

  // Handle numbers
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return undefined;
}
