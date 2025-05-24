import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReceiptDataEditor } from '../ReceiptDataEditor';

const mockOCRResult = {
  text: 'Sample receipt text',
  confidence: 0.85,
  extractedData: {
    amount: 100.50,
    type: 'expense',
    merchant: 'Test Store',
    date: '2024-03-20',
    category: 'Groceries',
    description: 'Weekly groceries'
  },
  rawData: {}
};

describe('ReceiptDataEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with extracted data', () => {
    render(
      <ReceiptDataEditor
        ocrResult={mockOCRResult}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Review Receipt Data')).toBeInTheDocument();
    expect(screen.getByText('OCR Confidence: 85%')).toBeInTheDocument();
    
    expect(screen.getByLabelText('Amount')).toHaveValue(100.50);
    expect(screen.getByLabelText('Type')).toHaveValue('expense');
    expect(screen.getByLabelText('Merchant')).toHaveValue('Test Store');
    expect(screen.getByLabelText('Date')).toHaveValue('2024-03-20');
    expect(screen.getByLabelText('Category')).toHaveValue('Groceries');
    expect(screen.getByLabelText('Description')).toHaveValue('Weekly groceries');
  });

  it('calls onSave with form data when submitted', async () => {
    render(
      <ReceiptDataEditor
        ocrResult={mockOCRResult}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Save Transaction'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        amount: 100.50,
        type: 'expense',
        merchant: 'Test Store',
        date: '2024-03-20',
        category: 'Groceries',
        description: 'Weekly groceries',
        userId: '',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ReceiptDataEditor
        ocrResult={mockOCRResult}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('updates form values when edited', () => {
    render(
      <ReceiptDataEditor
        ocrResult={mockOCRResult}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '150.75' } });
    expect(amountInput).toHaveValue(150.75);
    
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.change(typeSelect, { target: { value: 'income' } });
    expect(typeSelect).toHaveValue('income');
    
    const merchantInput = screen.getByLabelText('Merchant');
    fireEvent.change(merchantInput, { target: { value: 'New Store' } });
    expect(merchantInput).toHaveValue('New Store');
  });

  it('displays raw OCR text', () => {
    render(
      <ReceiptDataEditor
        ocrResult={mockOCRResult}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Raw OCR Text')).toBeInTheDocument();
    expect(screen.getByText('Sample receipt text')).toBeInTheDocument();
  });
}); 