import React, { useState, useCallback } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { ValidationErrors } from './ValidationErrors';
import { z } from 'zod';

interface ValidatedFormProps<T> {
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  validate: (data: T) => Promise<{ isValid: boolean; data?: T; errors?: z.ZodError }>;
  children: (props: {
    handleSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    errors?: z.ZodError;
    error?: string | null;
  }) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

export function ValidatedForm<T>({
  onSubmit,
  onCancel,
  validate,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}: ValidatedFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<z.ZodError>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrors(undefined);
      setError(null);

      try {
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries()) as unknown as T;

        const validationResult = await validate(data);
        if (!validationResult.isValid) {
          setErrors(validationResult.errors);
          return;
        }

        await onSubmit(validationResult.data as T);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validate]
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {children({
        handleSubmit,
        isSubmitting,
        errors,
        error,
      })}

      <ValidationErrors errors={errors} error={error} />

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {submitLabel}
        </Button>
      </Box>
    </Box>
  );
} 