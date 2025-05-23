import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useAsyncValidation } from './useAsyncValidation';

interface UseFormStateProps<T> {
  initialValues: T;
  validationSchema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  onValidate?: (data: T) => Promise<{ isValid: boolean; errors?: z.ZodError }>;
  debounceMs?: number;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isValidating: boolean;
}

export function useFormState<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  onValidate,
  debounceMs,
}: UseFormStateProps<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    isValidating: false,
  });

  const { validate, validateDebounced, reset: resetValidation } = useAsyncValidation({
    validationSchema,
    onValidate,
    debounceMs,
  });

  const handleChange = useCallback(
    async (name: string, value: any) => {
      const newValues = { ...state.values, [name]: value };
      setState((prev) => ({
        ...prev,
        values: newValues,
        touched: { ...prev.touched, [name]: true },
      }));

      const result = await validateDebounced(newValues);
      if (!result.isValid && result.errors) {
        const errors: Record<string, string> = {};
        result.errors.errors.forEach((error) => {
          const field = error.path[0] as string;
          errors[field] = error.message;
        });
        setState((prev) => ({ ...prev, errors }));
      } else {
        setState((prev) => ({ ...prev, errors: {} }));
      }
    },
    [state.values, validateDebounced]
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
      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const result = await validate(state.values);
        if (!result.isValid) {
          if (result.errors) {
            const errors: Record<string, string> = {};
            result.errors.errors.forEach((error) => {
              const field = error.path[0] as string;
              errors[field] = error.message;
            });
            setState((prev) => ({ ...prev, errors }));
          }
          return;
        }

        await onSubmit(result.data as T);
      } catch (err) {
        console.error('Form submission error:', err);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state.values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      isValidating: false,
    });
    resetValidation();
  }, [initialValues, resetValidation]);

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      handleChange(name, value);
    },
    [handleChange]
  );

  const setFieldTouched = useCallback(
    (name: string, isTouched = true) => {
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [name]: isTouched },
      }));
    },
    []
  );

  const setFieldError = useCallback((name: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isValidating: state.isValidating,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldTouched,
    setFieldError,
  };
} 