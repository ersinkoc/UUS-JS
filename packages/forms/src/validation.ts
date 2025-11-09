/**
 * Form validation system for UUS.js
 */

export interface ValidationRule {
  required?: boolean | ((formData: any) => boolean);
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  numeric?: boolean;
  custom?: (value: any, formData?: any) => boolean | string | Promise<boolean | string>;
  message?: string | ((value: any) => string);
  collectAllErrors?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

export interface FormValidator {
  validate: (formData: any, fields?: string[]) => FormValidationResult;
  validateField: (field: string, value: any, formData?: any) => ValidationResult;
  validateFieldAsync: (field: string, value: any, formData?: any) => Promise<ValidationResult>;
  addRule: (field: string, rule: ValidationRule) => void;
  removeRule: (field: string) => void;
  clearRules: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitizes error messages to prevent XSS attacks
 * - Escapes HTML special characters
 * - Limits message length to prevent DOM bloat
 * @param message - The error message to sanitize
 * @returns Sanitized error message safe for DOM rendering
 */
function sanitizeErrorMessage(message: string): string {
  if (typeof message !== 'string') {
    message = String(message);
  }

  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .substring(0, 200); // Limit length to prevent DOM bloat
}

export function createFormValidator(): FormValidator {
  const rules = new Map<string, ValidationRule>();

  function addRule(field: string, rule: ValidationRule): void {
    if (!rule || typeof rule !== 'object') {
      throw new Error('Invalid rule configuration');
    }
    rules.set(field, rule);
  }

  function removeRule(field: string): void {
    rules.delete(field);
  }

  function clearRules(): void {
    rules.clear();
  }

  function validateField(field: string, value: any, formData?: any): ValidationResult {
    const rule = rules.get(field);
    if (!rule) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    const collectAll = rule.collectAllErrors;

    try {
      // Required validation
      if (rule.required) {
        const isRequired = typeof rule.required === 'function'
          ? rule.required(formData)
          : rule.required;

        if (isRequired && (value === null || value === undefined || value === '')) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'This field is required', value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Skip other validations if value is empty and not required
      if (value === null || value === undefined || value === '') {
        return { valid: errors.length === 0, errors };
      }

      // MinLength validation
      if (rule.minLength !== undefined && typeof value === 'string') {
        if (value.length < rule.minLength) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, `Must be at least ${rule.minLength} characters`, value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // MaxLength validation
      if (rule.maxLength !== undefined && typeof value === 'string') {
        if (value.length > rule.maxLength) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, `Must be no more than ${rule.maxLength} characters`, value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'Invalid format', value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Email validation
      if (rule.email && typeof value === 'string') {
        if (!EMAIL_REGEX.test(value)) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'Invalid email format', value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Numeric validation
      if (rule.numeric) {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'Must be a number', value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Min value validation
      if (rule.min !== undefined) {
        const num = Number(value);
        if (!isNaN(num) && num < rule.min) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, `Must be at least ${rule.min}`, value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Max value validation
      if (rule.max !== undefined) {
        const num = Number(value);
        if (!isNaN(num) && num > rule.max) {
          errors.push(sanitizeErrorMessage(getErrorMessage(rule, `Must be no more than ${rule.max}`, value)));
          if (!collectAll) return { valid: false, errors };
        }
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value, formData);
        if (result !== true && result !== undefined) {
          if (typeof result === 'string') {
            errors.push(sanitizeErrorMessage(result));
          } else {
            errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'Validation failed', value)));
          }
          if (!collectAll) return { valid: false, errors };
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(sanitizeErrorMessage(`Validation error: ${errorMessage}`));
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async function validateFieldAsync(field: string, value: any, formData?: any): Promise<ValidationResult> {
    const rule = rules.get(field);
    if (!rule) {
      return { valid: true, errors: [] };
    }

    // Run sync validations first
    const syncResult = validateField(field, value, formData);
    if (!syncResult.valid && !rule.collectAllErrors) {
      return syncResult;
    }

    const errors = [...syncResult.errors];

    // Run async custom validation if present
    if (rule.custom) {
      try {
        const result = await rule.custom(value, formData);
        if (result !== true && result !== undefined) {
          if (typeof result === 'string') {
            errors.push(sanitizeErrorMessage(result));
          } else {
            errors.push(sanitizeErrorMessage(getErrorMessage(rule, 'Validation failed', value)));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(sanitizeErrorMessage(`Validation error: ${errorMessage}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validate(formData: any, fields?: string[]): FormValidationResult {
    const errors: Record<string, string[]> = {};
    const fieldsToValidate = fields || Array.from(rules.keys());
    let valid = true;

    for (const field of fieldsToValidate) {
      if (!rules.has(field)) continue;
      
      const value = formData[field];
      const result = validateField(field, value, formData);
      
      if (!result.valid) {
        errors[field] = result.errors;
        valid = false;
      }
    }

    return { valid, errors };
  }

  function getErrorMessage(rule: ValidationRule, defaultMessage: string, value: any): string {
    if (rule.message) {
      return typeof rule.message === 'function' 
        ? rule.message(value) 
        : rule.message;
    }
    return defaultMessage;
  }

  return {
    validate,
    validateField,
    validateFieldAsync,
    addRule,
    removeRule,
    clearRules
  };
}