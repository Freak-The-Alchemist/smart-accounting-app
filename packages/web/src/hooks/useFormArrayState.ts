import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useAsyncValidation } from './useAsyncValidation';

interface UseFormArrayStateProps<T> {
  initialValues: T[];
  validationSchema: z.ZodSchema<T>;
  onValidate?: (data: T[]) => Promise<{ isValid: boolean; errors?: z.ZodError }>;
  debounceMs?: number;
}

interface FormArrayState<T> {
  items: T[];
  errors: Record<number, Record<string, string>>;
  touched: Record<number, Record<string, boolean>>;
  isValid: boolean;
  isValidating: boolean;
}

export function useFormArrayState<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onValidate,
  debounceMs,
}: UseFormArrayStateProps<T>) {
  const [state, setState] = useState<FormArrayState<T>>({
    items: initialValues,
    errors: {},
    touched: {},
    isValid: false,
    isValidating: false,
  });

  const { validate, validateDebounced, reset: resetValidation } = useAsyncValidation({
    validationSchema: z.array(validationSchema),
    onValidate,
    debounceMs,
  });

  const validateItem = useCallback(
    async (index: number, item: T) => {
      const result = await validate([item]);
      if (!result.isValid && result.errors) {
        const errors: Record<string, string> = {};
        result.errors.errors.forEach((error) => {
          const field = error.path[1] as string;
          errors[field] = error.message;
        });
        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [index]: errors },
        }));
        return false;
      }
      return true;
    },
    [validate]
  );

  const handleItemChange = useCallback(
    async (index: number, name: string, value: any) => {
      const newItems = [...state.items];
      newItems[index] = { ...newItems[index], [name]: value };

      setState((prev) => ({
        ...prev,
        items: newItems,
        touched: {
          ...prev.touched,
          [index]: { ...prev.touched[index], [name]: true },
        },
      }));

      await validateItem(index, newItems[index]);
    },
    [state.items, validateItem]
  );

  const handleItemBlur = useCallback((index: number, name: string) => {
    setState((prev) => ({
      ...prev,
      touched: {
        ...prev.touched,
        [index]: { ...prev.touched[index], [name]: true },
      },
    }));
  }, []);

  const addItem = useCallback(
    (item: T) => {
      setState((prev) => ({
        ...prev,
        items: [...prev.items, item],
      }));
    },
    []
  );

  const removeItem = useCallback((index: number) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);

      const newErrors = { ...prev.errors };
      delete newErrors[index];

      const newTouched = { ...prev.touched };
      delete newTouched[index];

      // Reindex errors and touched states
      const reindexedErrors: Record<number, Record<string, string>> = {};
      const reindexedTouched: Record<number, Record<string, boolean>> = {};

      Object.keys(newErrors).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
        } else if (oldIndex < index) {
          reindexedErrors[oldIndex] = newErrors[oldIndex];
        }
      });

      Object.keys(newTouched).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexedTouched[oldIndex - 1] = newTouched[oldIndex];
        } else if (oldIndex < index) {
          reindexedTouched[oldIndex] = newTouched[oldIndex];
        }
      });

      return {
        ...prev,
        items: newItems,
        errors: reindexedErrors,
        touched: reindexedTouched,
      };
    });
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newItems = [...prev.items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);

      const newErrors = { ...prev.errors };
      const newTouched = { ...prev.touched };

      // Reindex errors and touched states
      const reindexedErrors: Record<number, Record<string, string>> = {};
      const reindexedTouched: Record<number, Record<string, boolean>> = {};

      Object.keys(newErrors).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex === fromIndex) {
          reindexedErrors[toIndex] = newErrors[oldIndex];
        } else if (oldIndex > fromIndex && oldIndex <= toIndex) {
          reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
        } else if (oldIndex < fromIndex && oldIndex >= toIndex) {
          reindexedErrors[oldIndex + 1] = newErrors[oldIndex];
        } else {
          reindexedErrors[oldIndex] = newErrors[oldIndex];
        }
      });

      Object.keys(newTouched).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex === fromIndex) {
          reindexedTouched[toIndex] = newTouched[oldIndex];
        } else if (oldIndex > fromIndex && oldIndex <= toIndex) {
          reindexedTouched[oldIndex - 1] = newTouched[oldIndex];
        } else if (oldIndex < fromIndex && oldIndex >= toIndex) {
          reindexedTouched[oldIndex + 1] = newTouched[oldIndex];
        } else {
          reindexedTouched[oldIndex] = newTouched[oldIndex];
        }
      });

      return {
        ...prev,
        items: newItems,
        errors: reindexedErrors,
        touched: reindexedTouched,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      items: initialValues,
      errors: {},
      touched: {},
      isValid: false,
      isValidating: false,
    });
    resetValidation();
  }, [initialValues, resetValidation]);

  const validateAll = useCallback(async () => {
    const result = await validate(state.items);
    if (!result.isValid && result.errors) {
      const errors: Record<number, Record<string, string>> = {};
      result.errors.errors.forEach((error) => {
        const index = error.path[0] as number;
        const field = error.path[1] as string;
        if (!errors[index]) {
          errors[index] = {};
        }
        errors[index][field] = error.message;
      });
      setState((prev) => ({ ...prev, errors }));
    } else {
      setState((prev) => ({ ...prev, errors: {} }));
    }
    return result.isValid;
  }, [state.items, validate]);

  return {
    items: state.items,
    errors: state.errors,
    touched: state.touched,
    isValid: state.isValid,
    isValidating: state.isValidating,
    handleItemChange,
    handleItemBlur,
    addItem,
    removeItem,
    moveItem,
    reset,
    validateItem,
    validateAll,
  };
} 