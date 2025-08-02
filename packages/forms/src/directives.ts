import type { Directive, UusInstance } from '@uusjs/core';
import { Form } from './form';
import { parseValidators } from './parser';
import { effect } from '@uusjs/core';

// Form directive
export const formDirective: Directive = {
  name: 'form',
  init(el, binding, uus) {
    if (!(el instanceof HTMLFormElement)) {
      console.error('uus-form must be used on a form element');
      return;
    }

    const formName = binding.expression || 'form';
    const form = new Form({
      validateOn: el.getAttribute('uus-validate-on') as any || 'blur',
      revalidateOn: el.getAttribute('uus-revalidate-on') as any || 'change'
    });

    // Store form in state
    uus.state[formName] = form.state;
    (el as any).__uusForm = form;

    // Handle form submission
    const handleSubmit = async (e: Event) => {
      e.preventDefault();
      
      const submitHandler = el.getAttribute('uus-on:submit');
      if (!submitHandler) return;

      try {
        await form.submitForm(async (values) => {
          // Evaluate submit handler
          const evaluator = (uus as any).createSafeEvaluator({
            ...uus.state,
            $values: values
          });
          await evaluator(submitHandler);
        });
      } catch (error) {
        console.error('Form submission error:', error);
      }
    };

    el.addEventListener('submit', handleSubmit);

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => {
      el.removeEventListener('submit', handleSubmit);
    });
    uus.cleanups.set(el, cleanups);
  }
};

// Field directive
export const fieldDirective: Directive = {
  name: 'field',
  bind(el, binding, uus) {
    if (!(el instanceof HTMLInputElement || 
          el instanceof HTMLTextAreaElement || 
          el instanceof HTMLSelectElement)) {
      console.error('uus-field can only be used on form elements');
      return;
    }

    const fieldName = binding.expression || el.name;
    if (!fieldName) {
      console.error('Field name is required');
      return;
    }

    // Find parent form
    const formEl = el.closest('form');
    const form = (formEl as any)?.__uusForm as Form | undefined;
    if (!form) {
      console.error('uus-field must be used inside a form with uus-form');
      return;
    }

    // Parse validators
    const validatorStr = el.getAttribute('uus-validate');
    const validators = validatorStr ? parseValidators(validatorStr) : [];

    // Register field
    form.setFieldValue(fieldName, el.value);
    const field = form.getField(fieldName);
    if (field) {
      field.validators = validators;
    }

    // Two-way binding
    const updateValue = () => {
      let value: any = el.value;
      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          value = el.checked;
        } else if (el.type === 'number') {
          value = el.valueAsNumber;
        }
      }
      form.setFieldValue(fieldName, value);
    };

    const updateElement = effect(() => {
      const field = form.getField(fieldName);
      if (!field) return;

      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = !!field.value;
      } else {
        el.value = String(field.value ?? '');
      }

      // Update validity state
      el.setAttribute('aria-invalid', String(!field.valid));
      if (field.errors.length > 0) {
        el.setAttribute('aria-describedby', `${fieldName}-error`);
      } else {
        el.removeAttribute('aria-describedby');
      }
    });

    // Event handlers
    el.addEventListener('input', updateValue);
    el.addEventListener('change', updateValue);
    el.addEventListener('blur', () => {
      form.setFieldTouched(fieldName);
    });

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(() => {
      el.removeEventListener('input', updateValue);
      el.removeEventListener('change', updateValue);
      updateElement();
    });
    uus.cleanups.set(el, cleanups);
  }
};

// Error directive
export const errorDirective: Directive = {
  name: 'error',
  bind(el, binding, uus) {
    const fieldName = binding.expression;
    if (!fieldName) {
      console.error('Field name is required for uus-error');
      return;
    }

    // Find parent form
    const formEl = el.closest('form');
    const form = (formEl as any)?.__uusForm as Form | undefined;
    if (!form) return;

    // Update error message
    const updateError = effect(() => {
      const field = form.getField(fieldName);
      if (!field) return;

      const showError = field.touched && field.errors.length > 0;
      el.style.display = showError ? '' : 'none';
      el.textContent = showError ? field.errors[0] : '';
      el.id = `${fieldName}-error`;
      el.setAttribute('role', 'alert');
    });

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(updateError);
    uus.cleanups.set(el, cleanups);
  }
};

// Submit directive
export const submitDirective: Directive = {
  name: 'submit',
  bind(el, binding, uus) {
    if (!(el instanceof HTMLButtonElement || el instanceof HTMLInputElement)) {
      console.error('uus-submit must be used on a button or input element');
      return;
    }

    // Find parent form
    const formEl = el.closest('form');
    const form = (formEl as any)?.__uusForm as Form | undefined;
    if (!form) return;

    // Update disabled state
    const updateDisabled = effect(() => {
      const shouldDisable = binding.expression === 'false' 
        ? false 
        : !form.state.valid || form.state.submitting;
      
      el.disabled = shouldDisable;
      
      if (form.state.submitting) {
        el.setAttribute('aria-busy', 'true');
      } else {
        el.removeAttribute('aria-busy');
      }
    });

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(updateDisabled);
    uus.cleanups.set(el, cleanups);
  }
};

// Disabled directive
export const disabledDirective: Directive = {
  name: 'disabled',
  bind(el, binding, uus) {
    if (!(el instanceof HTMLInputElement || 
          el instanceof HTMLButtonElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement)) {
      return;
    }

    const evaluator = (uus as any).createSafeEvaluator(uus.state);
    
    const updateDisabled = effect(() => {
      try {
        const shouldDisable = evaluator(binding.expression || 'false');
        el.disabled = !!shouldDisable;
      } catch (error) {
        console.error('Error evaluating disabled condition:', error);
      }
    });

    // Store cleanup
    const cleanups = uus.cleanups.get(el) || new Set();
    cleanups.add(updateDisabled);
    uus.cleanups.set(el, cleanups);
  }
};