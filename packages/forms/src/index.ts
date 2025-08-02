import type { UusPlugin } from '@uusjs/core';
import {
  formDirective,
  fieldDirective,
  errorDirective,
  submitDirective,
  disabledDirective,
} from './directives';
import { Form } from './form';
import * as validators from './validators';

export * from './types';
export { Form, validators };
export { createForm, createFormGroup } from './form';

// Create forms plugin
export function createForms(): UusPlugin {
  return {
    name: 'uus-forms',
    install(uus: any) {
      // Register directives
      uus.registerDirective(formDirective);
      uus.registerDirective(fieldDirective);
      uus.registerDirective(errorDirective);
      uus.registerDirective(submitDirective);
      uus.registerDirective(disabledDirective);

      // Add form utilities to state
      uus.state.$forms = {
        create: (options?: any) => new Form(options),
        validators,
      };
    },
  };
}

// Export individual validators for custom use
export {
  required,
  requiredTrue,
  email,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  number,
  integer,
  url,
  phone,
  date,
  match,
  custom,
  asyncEmailAvailable,
  debounceAsync,
  compose,
} from './validators';
