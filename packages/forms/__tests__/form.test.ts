import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createForm,
  createFormGroup,
  validators,
  ValidationErrors,
} from '../src/index';

describe('Forms', () => {
  describe('Form State Management', () => {
    it('should create form with initial values', () => {
      const form = createForm({
        name: '',
        email: '',
        age: 0,
      });

      expect(form.values.value).toEqual({
        name: '',
        email: '',
        age: 0,
      });
      expect(form.isDirty.value).toBe(false);
      expect(form.isValid.value).toBe(true);
    });

    it('should track dirty state', () => {
      const form = createForm({
        name: '',
      });

      expect(form.isDirty.value).toBe(false);

      form.setValue('name', 'John');
      expect(form.isDirty.value).toBe(true);
    });

    it('should track touched state', () => {
      const form = createForm({
        name: '',
      });

      expect(form.touched.value.name).toBe(false);

      form.setTouched('name', true);
      expect(form.touched.value.name).toBe(true);
    });

    it('should reset form', () => {
      const form = createForm({
        name: '',
        email: '',
      });

      form.setValue('name', 'John');
      form.setValue('email', 'john@example.com');
      form.setTouched('name', true);

      form.reset();

      expect(form.values.value).toEqual({
        name: '',
        email: '',
      });
      expect(form.isDirty.value).toBe(false);
      expect(form.touched.value).toEqual({
        name: false,
        email: false,
      });
    });

    it('should reset with new values', () => {
      const form = createForm({
        name: '',
      });

      form.setValue('name', 'John');
      form.reset({ name: 'Jane' });

      expect(form.values.value.name).toBe('Jane');
      expect(form.isDirty.value).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const form = createForm(
        { name: '' },
        {
          name: [validators.required()],
        }
      );

      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.name).toEqual({
        required: true,
      });

      form.setValue('name', 'John');
      expect(form.isValid.value).toBe(true);
      expect(form.errors.value.name).toBeUndefined();
    });

    it('should validate email format', () => {
      const form = createForm(
        { email: '' },
        {
          email: [validators.email()],
        }
      );

      form.setValue('email', 'invalid-email');
      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.email).toEqual({
        email: true,
      });

      form.setValue('email', 'valid@example.com');
      expect(form.isValid.value).toBe(true);
    });

    it('should validate min length', () => {
      const form = createForm(
        { password: '' },
        {
          password: [validators.minLength(8)],
        }
      );

      form.setValue('password', 'short');
      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.password).toEqual({
        minLength: { requiredLength: 8, actualLength: 5 },
      });

      form.setValue('password', 'longenough');
      expect(form.isValid.value).toBe(true);
    });

    it('should validate max length', () => {
      const form = createForm(
        { username: '' },
        {
          username: [validators.maxLength(10)],
        }
      );

      form.setValue('username', 'verylongusername');
      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.username).toEqual({
        maxLength: { requiredLength: 10, actualLength: 16 },
      });
    });

    it('should validate min value', () => {
      const form = createForm(
        { age: 0 },
        {
          age: [validators.min(18)],
        }
      );

      form.setValue('age', 16);
      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.age).toEqual({
        min: { min: 18, actual: 16 },
      });
    });

    it('should validate max value', () => {
      const form = createForm(
        { score: 0 },
        {
          score: [validators.max(100)],
        }
      );

      form.setValue('score', 150);
      expect(form.isValid.value).toBe(false);
      expect(form.errors.value.score).toEqual({
        max: { max: 100, actual: 150 },
      });
    });

    it('should validate pattern', () => {
      const form = createForm(
        { phone: '' },
        {
          phone: [validators.pattern(/^\d{3}-\d{3}-\d{4}$/)],
        }
      );

      form.setValue('phone', '123-456-789');
      expect(form.isValid.value).toBe(false);

      form.setValue('phone', '123-456-7890');
      expect(form.isValid.value).toBe(true);
    });

    it('should support multiple validators', () => {
      const form = createForm(
        { email: '' },
        {
          email: [validators.required(), validators.email()],
        }
      );

      expect(form.errors.value.email).toEqual({
        required: true,
      });

      form.setValue('email', 'invalid');
      expect(form.errors.value.email).toEqual({
        email: true,
      });

      form.setValue('email', 'valid@example.com');
      expect(form.errors.value.email).toBeUndefined();
    });

    it('should support custom validators', () => {
      const customValidator = (value: any): ValidationErrors | null => {
        if (value !== 'specific-value') {
          return { custom: 'Must be specific-value' };
        }
        return null;
      };

      const form = createForm(
        { field: '' },
        {
          field: [customValidator],
        }
      );

      expect(form.errors.value.field).toEqual({
        custom: 'Must be specific-value',
      });

      form.setValue('field', 'specific-value');
      expect(form.errors.value.field).toBeUndefined();
    });

    it('should support async validators', async () => {
      const asyncValidator = vi.fn(async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        if (value === 'taken') {
          return { taken: true };
        }
        return null;
      });

      const form = createForm(
        { username: '' },
        {
          username: { asyncValidators: [asyncValidator] },
        }
      );

      form.setValue('username', 'taken');
      expect(form.pending.value.username).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(form.pending.value.username).toBe(false);
      expect(form.errors.value.username).toEqual({ taken: true });
      expect(asyncValidator).toHaveBeenCalledWith('taken');
    });

    it('should debounce async validators', async () => {
      const asyncValidator = vi.fn(async () => null);

      const form = createForm(
        { field: '' },
        {
          field: {
            asyncValidators: [asyncValidator],
            debounce: 50,
          },
        }
      );

      form.setValue('field', 'a');
      form.setValue('field', 'ab');
      form.setValue('field', 'abc');

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should only be called once due to debouncing
      expect(asyncValidator).toHaveBeenCalledTimes(1);
      expect(asyncValidator).toHaveBeenCalledWith('abc');
    });
  });

  describe('Form Groups', () => {
    it('should create nested form groups', () => {
      const form = createFormGroup({
        user: createForm({
          name: '',
          email: '',
        }),
        settings: createForm({
          theme: 'light',
          notifications: true,
        }),
      });

      expect(form.values.value).toEqual({
        user: {
          name: '',
          email: '',
        },
        settings: {
          theme: 'light',
          notifications: true,
        },
      });
    });

    it('should track group validity', () => {
      const form = createFormGroup({
        user: createForm({ name: '' }, { name: [validators.required()] }),
        settings: createForm({ theme: 'light' }),
      });

      expect(form.isValid.value).toBe(false);

      form.controls.user.setValue('name', 'John');
      expect(form.isValid.value).toBe(true);
    });

    it('should track group dirty state', () => {
      const form = createFormGroup({
        user: createForm({ name: '' }),
        settings: createForm({ theme: 'light' }),
      });

      expect(form.isDirty.value).toBe(false);

      form.controls.user.setValue('name', 'John');
      expect(form.isDirty.value).toBe(true);
    });

    it('should reset entire group', () => {
      const form = createFormGroup({
        user: createForm({ name: '' }),
        settings: createForm({ theme: 'light' }),
      });

      form.controls.user.setValue('name', 'John');
      form.controls.settings.setValue('theme', 'dark');

      form.reset();

      expect(form.values.value).toEqual({
        user: { name: '' },
        settings: { theme: 'light' },
      });
      expect(form.isDirty.value).toBe(false);
    });

    it('should collect all errors from group', () => {
      const form = createFormGroup({
        user: createForm(
          { name: '', email: '' },
          {
            name: [validators.required()],
            email: [validators.email()],
          }
        ),
      });

      form.controls.user.setValue('email', 'invalid');

      expect(form.errors.value).toEqual({
        user: {
          name: { required: true },
          email: { email: true },
        },
      });
    });
  });

  describe('Form Directive Integration', () => {
    it('should handle form submission', () => {
      const form = createForm({
        name: '',
        email: '',
      });

      const onSubmit = vi.fn();
      form.handleSubmit(onSubmit)({ preventDefault: vi.fn() } as any);

      expect(onSubmit).toHaveBeenCalledWith({
        name: '',
        email: '',
      });
    });

    it('should prevent submission if invalid', () => {
      const form = createForm({ name: '' }, { name: [validators.required()] });

      const onSubmit = vi.fn();
      form.handleSubmit(onSubmit)({ preventDefault: vi.fn() } as any);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should validate all fields on submit attempt', () => {
      const form = createForm(
        { name: '', email: '' },
        {
          name: [validators.required()],
          email: [validators.required()],
        }
      );

      const onSubmit = vi.fn();
      form.handleSubmit(onSubmit)({ preventDefault: vi.fn() } as any);

      expect(form.touched.value).toEqual({
        name: true,
        email: true,
      });
    });
  });

  describe('Built-in Validators', () => {
    it('should validate requiredTrue', () => {
      const validator = validators.requiredTrue();

      expect(validator(true)).toBeNull();
      expect(validator(false)).toEqual({ requiredTrue: true });
      expect(validator(null)).toEqual({ requiredTrue: true });
    });

    it('should validate custom email patterns', () => {
      const validator = validators.email();

      expect(validator('test@example.com')).toBeNull();
      expect(validator('test.name+tag@example.co.uk')).toBeNull();
      expect(validator('invalid@')).toEqual({ email: true });
      expect(validator('@example.com')).toEqual({ email: true });
      expect(validator('no-at-sign')).toEqual({ email: true });
    });

    it('should compose validators', () => {
      const form = createForm(
        { password: '' },
        {
          password: [
            validators.required(),
            validators.minLength(8),
            validators.pattern(/[A-Z]/),
          ],
        }
      );

      form.setValue('password', '');
      expect(form.errors.value.password).toEqual({ required: true });

      form.setValue('password', 'short');
      expect(form.errors.value.password).toEqual({
        minLength: { requiredLength: 8, actualLength: 5 },
      });

      form.setValue('password', 'longenough');
      expect(form.errors.value.password).toEqual({ pattern: true });

      form.setValue('password', 'LongEnough');
      expect(form.errors.value.password).toBeUndefined();
    });
  });
});
