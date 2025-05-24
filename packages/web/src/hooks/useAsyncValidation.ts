import { useState, useCallback, useRef } from 'react';
import { z } from 'zod';

interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: z.ZodError;
}

interface UseAsyncValidationProps<T> {
  validationSchema: z.ZodSchema<T>;
  onValidate?: (data: T) => Promise<ValidationResult<T>>;
  debounceMs?: number;
}

interface ValidationState<T> {
  isValid: boolean;
  isValidating: boolean;
  errors?: z.ZodError;
  error?: string | null;
  data?: T;
}

export function useAsyncValidation<T>({
  validationSchema,
  onValidate,
  debounceMs = 300,
}: UseAsyncValidationProps<T>) {
  const [state, setState] = useState<ValidationState<T>>({
    isValid: false,
    isValidating: false,
  });

  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValidationRef = useRef<{
    data: T;
    timestamp: number;
  }>();

  const validate = useCallback(
    async (data: T): Promise<ValidationResult<T>> => {
      // Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }

      // Check if we've already validated this exact data
      const now = Date.now();
      if (
        lastValidationRef.current &&
        lastValidationRef.current.data === data &&
        now - lastValidationRef.current.timestamp < debounceMs
      ) {
        return {
          isValid: state.isValid,
          data: state.data,
          errors: state.errors,
        };
      }

      setState((prev) => ({ ...prev, isValidating: true }));

      try {
        // First validate with Zod schema
        const parsedData = validationSchema.parse(data);

        // If there's a custom validator, use it
        if (onValidate) {
          const result = await onValidate(parsedData);
          setState({
            isValid: result.isValid,
            isValidating: false,
            errors: result.errors,
            data: result.data,
          });
          return result;
        }

        // If no custom validator, just use Zod result
        setState({
          isValid: true,
          isValidating: false,
          data: parsedData,
        });

        return {
          isValid: true,
          data: parsedData,
        };
      } catch (err) {
        if (err instanceof z.ZodError) {
          setState({
            isValid: false,
            isValidating: false,
            errors: err,
          });
          return {
            isValid: false,
            errors: err,
          };
        }

        const error = err instanceof Error ? err.message : 'Validation failed';
        setState({
          isValid: false,
          isValidating: false,
          error,
        });
        return {
          isValid: false,
        };
      }
    },
    [validationSchema, onValidate, debounceMs, state.isValid, state.data, state.errors]
  );

  const validateDebounced = useCallback(
    (data: T) => {
      return new Promise<ValidationResult<T>>((resolve) => {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        validationTimeoutRef.current = setTimeout(async () => {
          const result = await validate(data);
          resolve(result);
        }, debounceMs);
      });
    },
    [validate, debounceMs]
  );

  const reset = useCallback(() => {
    setState({
      isValid: false,
      isValidating: false,
    });
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    lastValidationRef.current = undefined;
  }, []);

  return {
    ...state,
    validate,
    validateDebounced,
    reset,
  };
} 