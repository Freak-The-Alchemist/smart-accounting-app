import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormValidationProps<T> {
  initialValues: T;
  validationSchema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormValidationProps<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const validateField = useCallback(
    (name: string, value: any) => {
      try {
        validationSchema.parse({ ...state.values, [name]: value });
        return '';
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldError = err.errors.find((error) => error.path[0] === name);
          return fieldError?.message || '';
        }
        return '';
      }
    },
    [state.values, validationSchema]
  );

  const validateForm = useCallback(() => {
    try {
      validationSchema.parse(state.values);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as string;
          errors[field] = error.message;
        });
        setState((prev) => ({ ...prev, errors }));
      }
      return false;
    }
  }, [state.values, validationSchema]);

  const handleChange = useCallback(
    (name: string, value: any) => {
      const error = validateField(name, value);
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [name]: value },
        errors: { ...prev.errors, [name]: error },
        touched: { ...prev.touched, [name]: true },
      }));
    },
    [validateField]
  );

  const handleBlur = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isValid = validateForm();
      if (!isValid) return;

      setState((prev) => ({ ...prev, isSubmitting: true }));
      try {
        await onSubmit(state.values);
      } catch (err) {
        console.error('Form submission error:', err);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state.values, validateForm, onSubmit]
  );

  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    });
  }, [initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateField,
    validateForm,
  };
} 