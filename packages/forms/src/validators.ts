import type { Validator, AsyncValidator } from './types';

// Required validator
export const required = (): Validator => (value) => {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return { required: true };
  }
  return null;
};

// Required true validator (for checkboxes)
export const requiredTrue = (): Validator => (value) => {
  return value === true ? null : { requiredTrue: true };
};

// Email validator
export const email = (): Validator => (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : { email: true };
};

// Min length validator
export const minLength = (min: number): Validator => (value) => {
  if (!value) return null;
  const length = typeof value === 'string' ? value.length : value.toString().length;
  return length >= min ? null : { minLength: { requiredLength: min, actualLength: length } };
};

// Max length validator
export const maxLength = (max: number): Validator => (value) => {
  if (!value) return null;
  const length = typeof value === 'string' ? value.length : value.toString().length;
  return length <= max ? null : { maxLength: { requiredLength: max, actualLength: length } };
};

// Min value validator
export const min = (minValue: number): Validator => (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  return !isNaN(num) && num >= minValue ? null : { min: { min: minValue, actual: num } };
};

// Max value validator
export const max = (maxValue: number): Validator => (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  return !isNaN(num) && num <= maxValue ? null : { max: { max: maxValue, actual: num } };
};

// Pattern validator
export const pattern = (regex: RegExp, message?: string): Validator => (value) => {
  if (!value) return null;
  return regex.test(value) ? null : { pattern: true };
};

// Number validator
export const number: Validator = (value) => {
  if (!value && value !== 0) return null;
  return !isNaN(Number(value)) ? null : { number: true };
};

// Integer validator
export const integer: Validator = (value) => {
  if (!value && value !== 0) return null;
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num) ? null : { integer: true };
};

// URL validator
export const url: Validator = (value) => {
  if (!value) return null;
  try {
    new URL(value);
    return null;
  } catch {
    return { url: true };
  }
};

// Phone validator (basic)
export const phone: Validator = (value) => {
  if (!value) return null;
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10 
    ? null 
    : { phone: true };
};

// Date validator
export const date: Validator = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return !isNaN(date.getTime()) ? null : { date: true };
};

// Match validator (for confirming passwords, etc.)
export const match = (fieldName: string, message?: string): Validator => (value, field, form) => {
  if (!value || !form) return null;
  const otherValue = form.values[fieldName];
  return value === otherValue ? null : { match: { field: fieldName } };
};

// Custom validator helper
export const custom = (fn: (value: any) => boolean, message: string): Validator => (value) => {
  return fn(value) ? null : { custom: message };
};

// Async validators

// Async email check (example)
export const asyncEmailAvailable = (checkFn: (email: string) => Promise<boolean>): AsyncValidator => {
  return async (value) => {
    if (!value || !email(value)) return null;
    const available = await checkFn(value);
    return available ? null : 'This email is already taken';
  };
};

// Debounced async validator helper
export function debounceAsync(
  validator: AsyncValidator, 
  delay: number = 300
): AsyncValidator {
  let timeoutId: any;
  
  return (value, field, form) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value, field, form);
        resolve(result);
      }, delay);
    });
  };
}

// Validator composer
export function compose(...validators: Validator[]): Validator {
  return (value, field, form) => {
    for (const validator of validators) {
      const error = validator(value, field, form);
      if (error) return error;
    }
    return null;
  };
}