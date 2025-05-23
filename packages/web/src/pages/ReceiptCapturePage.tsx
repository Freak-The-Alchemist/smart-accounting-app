import React from 'react';
import { ReceiptCapture } from '../components/ReceiptCapture';
import { ReceiptDataEditor } from '../components/ReceiptDataEditor';
import { OCRStatus } from '../components/OCRStatus';
import { useOCR } from '../hooks/useOCR';
import { Transaction } from '@smart-accounting/shared/src/models/Transaction';
import '../styles/ReceiptCapturePage.css';

export const ReceiptCapturePage: React.FC = () => {
  const {
    status,
    progress,
    error,
    result,
    processImage,
    reset,
    saveTransaction,
  } = useOCR();

  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    await saveTransaction(transaction);
    // After successful save, reset the form
    reset();
  };

  return (
    <div className="receipt-capture-page">
      <h1>Capture Receipt</h1>
      <p className="page-description">
        Take a photo of your receipt or upload an image to automatically extract transaction details.
      </p>

      <OCRStatus
        status={status}
        progress={progress}
        error={error || undefined}
      />

      {status === 'idle' && (
        <ReceiptCapture onImageProcess={processImage} />
      )}

      {status === 'success' && result && (
        <ReceiptDataEditor
          ocrResult={result}
          onSave={handleSaveTransaction}
          onCancel={reset}
        />
      )}

      {status === 'error' && (
        <div className="error-actions">
          <button className="btn btn-primary" onClick={reset}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}; 