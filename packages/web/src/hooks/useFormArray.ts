import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormArrayProps<T> {
  initialValues: T[];
  validationSchema: z.ZodSchema<T>;
  onValidate?: (items: T[]) => Promise<{ isValid: boolean; errors?: z.ZodError }>;
}

interface FormArrayState<T> {
  items: T[];
  errors: Record<number, Record<string, string>>;
  touched: Record<number, Record<string, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useFormArray<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onValidate,
}: UseFormArrayProps<T>) {
  const [state, setState] = useState<FormArrayState<T>>({
    items: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });

  const validateItem = useCallback(
    (index: number, item: T) => {
      try {
        validationSchema.parse(item);
        return {};
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          err.errors.forEach((error) => {
            const field = error.path[0] as string;
            errors[field] = error.message;
          });
          return errors;
        }
        return {};
      }
    },
    [validationSchema]
  );

  const validateAll = useCallback(async () => {
    if (onValidate) {
      const result = await onValidate(state.items);
      if (!result.isValid) {
        return false;
      }
    }

    const errors: Record<number, Record<string, string>> = {};
    let isValid = true;

    state.items.forEach((item, index) => {
      const itemErrors = validateItem(index, item);
      if (Object.keys(itemErrors).length > 0) {
        errors[index] = itemErrors;
        isValid = false;
      }
    });

    setState((prev) => ({ ...prev, errors, isValid }));
    return isValid;
  }, [state.items, validateItem, onValidate]);

  const handleItemChange = useCallback(
    (index: number, name: string, value: any) => {
      setState((prev) => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], [name]: value };

        const errors = { ...prev.errors };
        const itemErrors = validateItem(index, newItems[index]);
        if (Object.keys(itemErrors).length > 0) {
          errors[index] = itemErrors;
        } else {
          delete errors[index];
        }

        const touched = { ...prev.touched };
        if (!touched[index]) {
          touched[index] = {};
        }
        touched[index][name] = true;

        return {
          ...prev,
          items: newItems,
          errors,
          touched,
        };
      });
    },
    [validateItem]
  );

  const handleItemBlur = useCallback((index: number, name: string) => {
    setState((prev) => {
      const touched = { ...prev.touched };
      if (!touched[index]) {
        touched[index] = {};
      }
      touched[index][name] = true;
      return { ...prev, touched };
    });
  }, []);

  const addItem = useCallback((item: T) => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setState((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);

      const errors = { ...prev.errors };
      delete errors[index];

      const touched = { ...prev.touched };
      delete touched[index];

      return {
        ...prev,
        items: newItems,
        errors,
        touched,
      };
    });
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newItems = [...prev.items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);

      const errors = { ...prev.errors };
      const touched = { ...prev.touched };

      // Reindex errors and touched
      const newErrors: Record<number, Record<string, string>> = {};
      const newTouched: Record<number, Record<string, boolean>> = {};

      Object.keys(errors).forEach((key) => {
        const index = parseInt(key);
        if (index === fromIndex) {
          newErrors[toIndex] = errors[index];
        } else if (index > fromIndex && index <= toIndex) {
          newErrors[index - 1] = errors[index];
        } else if (index < fromIndex && index >= toIndex) {
          newErrors[index + 1] = errors[index];
        } else {
          newErrors[index] = errors[index];
        }
      });

      Object.keys(touched).forEach((key) => {
        const index = parseInt(key);
        if (index === fromIndex) {
          newTouched[toIndex] = touched[index];
        } else if (index > fromIndex && index <= toIndex) {
          newTouched[index - 1] = touched[index];
        } else if (index < fromIndex && index >= toIndex) {
          newTouched[index + 1] = touched[index];
        } else {
          newTouched[index] = touched[index];
        }
      });

      return {
        ...prev,
        items: newItems,
        errors: newErrors,
        touched: newTouched,
      };
    });
  }, []);

  const resetItems = useCallback(() => {
    setState({
      items: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    });
  }, [initialValues]);

  return {
    items: state.items,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleItemChange,
    handleItemBlur,
    addItem,
    removeItem,
    moveItem,
    resetItems,
    validateAll,
  };
} 