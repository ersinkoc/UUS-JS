import { describe, it, expect, beforeEach } from 'vitest';
import { createFormValidator, ValidationRule, ValidationResult } from '../validation';

describe('Form Validation', () => {
  describe('createFormValidator', () => {
    it('should create a validator instance', () => {
      const validator = createFormValidator();
      expect(validator).toBeDefined();
      expect(validator.validate).toBeDefined();
      expect(validator.validateField).toBeDefined();
      expect(validator.addRule).toBeDefined();
    });
  });

  describe('Built-in Validation Rules', () => {
    let validator: ReturnType<typeof createFormValidator>;

    beforeEach(() => {
      validator = createFormValidator();
    });

    describe('required', () => {
      it('should validate required fields', () => {
        validator.addRule('username', { required: true });
        
        expect(validator.validateField('username', '')).toEqual({
          valid: false,
          errors: ['This field is required']
        });
        
        expect(validator.validateField('username', 'john')).toEqual({
          valid: true,
          errors: []
        });
      });

      it('should handle null and undefined values', () => {
        validator.addRule('field', { required: true });
        
        expect(validator.validateField('field', null)).toEqual({
          valid: false,
          errors: ['This field is required']
        });
        
        expect(validator.validateField('field', undefined)).toEqual({
          valid: false,
          errors: ['This field is required']
        });
      });
    });

    describe('minLength', () => {
      it('should validate minimum length', () => {
        validator.addRule('password', { minLength: 8 });
        
        expect(validator.validateField('password', 'short')).toEqual({
          valid: false,
          errors: ['Must be at least 8 characters']
        });
        
        expect(validator.validateField('password', 'longpassword')).toEqual({
          valid: true,
          errors: []
        });
      });
    });

    describe('maxLength', () => {
      it('should validate maximum length', () => {
        validator.addRule('bio', { maxLength: 100 });
        
        const longText = 'a'.repeat(101);
        expect(validator.validateField('bio', longText)).toEqual({
          valid: false,
          errors: ['Must be no more than 100 characters']
        });
        
        expect(validator.validateField('bio', 'Short bio')).toEqual({
          valid: true,
          errors: []
        });
      });
    });

    describe('pattern', () => {
      it('should validate against regex pattern', () => {
        validator.addRule('email', { 
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Invalid email format'
        });
        
        expect(validator.validateField('email', 'invalid')).toEqual({
          valid: false,
          errors: ['Invalid email format']
        });
        
        expect(validator.validateField('email', 'user@example.com')).toEqual({
          valid: true,
          errors: []
        });
      });
    });

    describe('email', () => {
      it('should validate email addresses', () => {
        validator.addRule('email', { email: true });
        
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user@.com',
          'user @example.com'
        ];
        
        invalidEmails.forEach(email => {
          expect(validator.validateField('email', email).valid).toBe(false);
        });
        
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user123@test-domain.org'
        ];
        
        validEmails.forEach(email => {
          expect(validator.validateField('email', email).valid).toBe(true);
        });
      });
    });

    describe('numeric', () => {
      it('should validate numeric values', () => {
        validator.addRule('age', { numeric: true });
        
        expect(validator.validateField('age', 'abc')).toEqual({
          valid: false,
          errors: ['Must be a number']
        });
        
        expect(validator.validateField('age', '25')).toEqual({
          valid: true,
          errors: []
        });
        
        expect(validator.validateField('age', 25)).toEqual({
          valid: true,
          errors: []
        });
      });
    });

    describe('min/max', () => {
      it('should validate minimum value', () => {
        validator.addRule('age', { min: 18 });
        
        expect(validator.validateField('age', 16)).toEqual({
          valid: false,
          errors: ['Must be at least 18']
        });
        
        expect(validator.validateField('age', 25)).toEqual({
          valid: true,
          errors: []
        });
      });

      it('should validate maximum value', () => {
        validator.addRule('quantity', { max: 100 });
        
        expect(validator.validateField('quantity', 150)).toEqual({
          valid: false,
          errors: ['Must be no more than 100']
        });
        
        expect(validator.validateField('quantity', 50)).toEqual({
          valid: true,
          errors: []
        });
      });
    });

    describe('custom validation', () => {
      it('should support custom validation functions', () => {
        validator.addRule('username', {
          custom: (value: any) => {
            if (value === 'admin') {
              return 'Username "admin" is reserved';
            }
            return true;
          }
        });
        
        expect(validator.validateField('username', 'admin')).toEqual({
          valid: false,
          errors: ['Username "admin" is reserved']
        });
        
        expect(validator.validateField('username', 'user')).toEqual({
          valid: true,
          errors: []
        });
      });

      it('should support async custom validation', async () => {
        validator.addRule('username', {
          custom: async (value: any) => {
            // Simulate async check
            await new Promise(resolve => setTimeout(resolve, 10));
            
            if (value === 'taken') {
              return 'Username is already taken';
            }
            return true;
          }
        });
        
        const result = await validator.validateFieldAsync('username', 'taken');
        expect(result).toEqual({
          valid: false,
          errors: ['Username is already taken']
        });
      });
    });
  });

  describe('Multiple Rules', () => {
    let validator: ReturnType<typeof createFormValidator>;

    beforeEach(() => {
      validator = createFormValidator();
    });

    it('should validate multiple rules for a field', () => {
      validator.addRule('password', {
        required: true,
        minLength: 8,
        pattern: /^(?=.*[A-Z])(?=.*[0-9])/,
        message: 'Password must contain at least one uppercase letter and one number'
      });
      
      expect(validator.validateField('password', '')).toEqual({
        valid: false,
        errors: ['This field is required']
      });
      
      expect(validator.validateField('password', 'short')).toEqual({
        valid: false,
        errors: ['Must be at least 8 characters']
      });
      
      expect(validator.validateField('password', 'longenough')).toEqual({
        valid: false,
        errors: ['Password must contain at least one uppercase letter and one number']
      });
      
      expect(validator.validateField('password', 'Password1')).toEqual({
        valid: true,
        errors: []
      });
    });

    it('should collect all errors when multiple rules fail', () => {
      validator.addRule('field', {
        required: true,
        minLength: 5,
        maxLength: 10,
        collectAllErrors: true
      });
      
      expect(validator.validateField('field', '')).toEqual({
        valid: false,
        errors: [
          'This field is required',
          'Must be at least 5 characters'
        ]
      });
    });
  });

  describe('Form-level Validation', () => {
    let validator: ReturnType<typeof createFormValidator>;

    beforeEach(() => {
      validator = createFormValidator();
    });

    it('should validate entire form', () => {
      validator.addRule('username', { required: true, minLength: 3 });
      validator.addRule('email', { required: true, email: true });
      validator.addRule('age', { numeric: true, min: 18 });
      
      const formData = {
        username: 'ab',
        email: 'invalid',
        age: 16
      };
      
      const result = validator.validate(formData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({
        username: ['Must be at least 3 characters'],
        email: ['Invalid email format'],
        age: ['Must be at least 18']
      });
    });

    it('should validate only specified fields', () => {
      validator.addRule('field1', { required: true });
      validator.addRule('field2', { required: true });
      validator.addRule('field3', { required: true });
      
      const formData = {
        field1: 'value1',
        field2: ''
      };
      
      const result = validator.validate(formData, ['field1', 'field2']);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual({
        field2: ['This field is required']
      });
      expect(result.errors.field3).toBeUndefined();
    });
  });

  describe('Dynamic Rules', () => {
    let validator: ReturnType<typeof createFormValidator>;

    beforeEach(() => {
      validator = createFormValidator();
    });

    it('should support conditional validation', () => {
      validator.addRule('email', {
        required: (formData: any) => formData.contactMethod === 'email'
      });
      
      expect(validator.validateField('email', '', { contactMethod: 'phone' })).toEqual({
        valid: true,
        errors: []
      });
      
      expect(validator.validateField('email', '', { contactMethod: 'email' })).toEqual({
        valid: false,
        errors: ['This field is required']
      });
    });

    it('should support dynamic error messages', () => {
      validator.addRule('age', {
        min: 18,
        message: (value: any) => `You must be 18 or older (you entered ${value})`
      });
      
      expect(validator.validateField('age', 16)).toEqual({
        valid: false,
        errors: ['You must be 18 or older (you entered 16)']
      });
    });
  });

  describe('Error Handling', () => {
    let validator: ReturnType<typeof createFormValidator>;

    beforeEach(() => {
      validator = createFormValidator();
    });

    it('should handle validation errors gracefully', () => {
      validator.addRule('field', {
        custom: () => {
          throw new Error('Validation error');
        }
      });
      
      const result = validator.validateField('field', 'value');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Validation error');
    });

    it('should handle invalid rule configurations', () => {
      expect(() => {
        validator.addRule('field', null as any);
      }).toThrow();
    });
  });
});