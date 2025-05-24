import React, { useState } from 'react';
import { Transaction, TransactionType } from '@smart-accounting/shared/src/models/Transaction';
import { OCRResult } from '@smart-accounting/shared/src/services/OCRService';
import '../styles/ReceiptDataEditor.css';

interface ReceiptDataEditorProps {
  ocrResult: OCRResult;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

export const ReceiptDataEditor: React.FC<ReceiptDataEditorProps> = ({
  ocrResult,
  onSave,
  onCancel,
}) => {
  const [editedData, setEditedData] = useState({
    amount: ocrResult.extractedData.amount || 0,
    type: ocrResult.extractedData.type || 'expense',
    merchant: ocrResult.extractedData.merchant || '',
    date: ocrResult.extractedData.date || new Date().toISOString().split('T')[0],
    category: ocrResult.extractedData.category || '',
    description: ocrResult.extractedData.description || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...editedData,
      userId: '', // This will be set by the service
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <div className="receipt-data-editor">
      <h2>Review Receipt Data</h2>
      <div className="confidence-indicator">
        OCR Confidence: {Math.round(ocrResult.confidence * 100)}%
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={editedData.amount}
            onChange={handleInputChange}
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={editedData.type}
            onChange={handleInputChange}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="merchant">Merchant</label>
          <input
            type="text"
            id="merchant"
            name="merchant"
            value={editedData.merchant}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={editedData.date}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={editedData.category}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={editedData.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            Save Transaction
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>

      <div className="raw-text">
        <h3>Raw OCR Text</h3>
        <pre>{ocrResult.text}</pre>
      </div>
    </div>
  );
}; 