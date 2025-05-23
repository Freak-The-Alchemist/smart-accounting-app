import { useState, useCallback } from 'react';
import { dataValidationService } from '@smart-accounting/shared/src/services/DataValidationService';
import { z } from 'zod';

interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: z.ZodError;
}

export function useDataValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUserProfile = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateUserProfile(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateUserSettings = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateUserSettings(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateTransaction = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateTransaction(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateShift = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateShift(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateExpense = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateExpense(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateAuditLog = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateAuditLog(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateSecurityAlert = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateSecurityAlert(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateEncryptionKey = useCallback(async (data: any): Promise<ValidationResult<any>> => {
    setIsValidating(true);
    setError(null);
    try {
      const result = await dataValidationService.validateEncryptionKey(data);
      return { isValid: true, data: result };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { isValid: false, errors: err };
      }
      setError(err instanceof Error ? err.message : 'Validation failed');
      return { isValid: false };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    isValidating,
    error,
    validateUserProfile,
    validateUserSettings,
    validateTransaction,
    validateShift,
    validateExpense,
    validateAuditLog,
    validateSecurityAlert,
    validateEncryptionKey,
  };
} 