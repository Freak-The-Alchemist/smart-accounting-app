import { useState, useCallback } from 'react';
import { OCRService, OCRResult } from '@smart-accounting/shared/src/services/OCRService';
import { Transaction } from '@smart-accounting/shared/src/models/Transaction';

interface UseOCRReturn {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  error: string | null;
  result: OCRResult | null;
  processImage: (imageData: string) => Promise<void>;
  reset: () => void;
  saveTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

export const useOCR = (): UseOCRReturn => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);

  const processImage = useCallback(async (imageData: string) => {
    try {
      setStatus('processing');
      setProgress(0);
      setError(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const ocrService = new OCRService();
      const result = await ocrService.processImage(imageData);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const saveTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      setStatus('processing');
      // Here you would typically call your transaction service to save the transaction
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
      setStatus('error');
    }
  }, []);

  return {
    status,
    progress,
    error,
    result,
    processImage,
    reset,
    saveTransaction,
  };
}; 