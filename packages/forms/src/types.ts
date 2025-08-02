export interface FormField {
  name: string;
  value: any;
  errors: ValidationErrors[];
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  validators: Validator[];
}

export interface FormState {
  fields: Record<string, FormField>;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  submitting: boolean;
  submitted: boolean;
  errors: Record<string, ValidationErrors>;
  values: Record<string, any>;
}

export type Validator = (value: any, field?: FormField, form?: FormState) => ValidationErrors | null;

export type AsyncValidator = (value: any, field?: FormField, form?: FormState) => Promise<ValidationErrors | null>;

export type ValidationErrors = Record<string, any>;

export interface ValidationRule {
  name: string;
  validator: Validator | AsyncValidator;
  message?: string;
}

export interface FormOptions {
  validateOn?: 'change' | 'blur' | 'submit';
  revalidateOn?: 'change' | 'blur';
  initialValues?: Record<string, any>;
  validators?: Record<string, Validator[]>;
}

export interface FieldOptions {
  validators?: Validator[];
  asyncValidators?: AsyncValidator[];
  validateOn?: 'change' | 'blur';
  defaultValue?: any;
}

export interface FormController {
  state: FormState;
  getField(name: string): FormField | undefined;
  setFieldValue(name: string, value: any): void;
  setFieldTouched(name: string, touched?: boolean): void;
  validateField(name: string): Promise<boolean>;
  validateForm(): Promise<boolean>;
  resetField(name: string): void;
  resetForm(): void;
  submitForm(handler: (values: Record<string, any>) => void | Promise<void>): Promise<void>;
}