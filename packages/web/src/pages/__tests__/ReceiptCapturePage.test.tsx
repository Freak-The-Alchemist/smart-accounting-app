import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReceiptCapturePage } from '../ReceiptCapturePage';
import { useOCR } from '../../hooks/useOCR';

// Mock the useOCR hook
jest.mock('../../hooks/useOCR');

const mockUseOCR = useOCR as jest.MockedFunction<typeof useOCR>;

describe('ReceiptCapturePage', () => {
  const mockProcessImage = jest.fn();
  const mockReset = jest.fn();
  const mockSaveTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOCR.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
      result: null,
      processImage: mockProcessImage,
      reset: mockReset,
      saveTransaction: mockSaveTransaction
    });
  });

  it('renders initial state with capture options', () => {
    render(<ReceiptCapturePage />);
    
    expect(screen.getByText('Capture Receipt')).toBeInTheDocument();
    expect(screen.getByText(/Take a photo of your receipt/)).toBeInTheDocument();
    expect(screen.getByText('Open Camera')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows processing status', () => {
    mockUseOCR.mockReturnValue({
      status: 'processing',
      progress: 50,
      error: null,
      result: null,
      processImage: mockProcessImage,
      reset: mockReset,
      saveTransaction: mockSaveTransaction
    });

    render(<ReceiptCapturePage />);
    
    expect(screen.getByText('Processing receipt...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows error state with retry option', () => {
    mockUseOCR.mockReturnValue({
      status: 'error',
      progress: 0,
      error: 'Failed to process image',
      result: null,
      processImage: mockProcessImage,
      reset: mockReset,
      saveTransaction: mockSaveTransaction
    });

    render(<ReceiptCapturePage />);
    
    expect(screen.getByText('Error processing receipt')).toBeInTheDocument();
    expect(screen.getByText('Failed to process image')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockReset).toHaveBeenCalled();
  });

  it('shows data editor when processing is successful', () => {
    const mockResult = {
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

    mockUseOCR.mockReturnValue({
      status: 'success',
      progress: 100,
      error: null,
      result: mockResult,
      processImage: mockProcessImage,
      reset: mockReset,
      saveTransaction: mockSaveTransaction
    });

    render(<ReceiptCapturePage />);
    
    expect(screen.getByText('Review Receipt Data')).toBeInTheDocument();
    expect(screen.getByText('OCR Confidence: 85%')).toBeInTheDocument();
  });

  it('handles transaction save', async () => {
    const mockResult = {
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

    mockUseOCR.mockReturnValue({
      status: 'success',
      progress: 100,
      error: null,
      result: mockResult,
      processImage: mockProcessImage,
      reset: mockReset,
      saveTransaction: mockSaveTransaction
    });

    render(<ReceiptCapturePage />);
    
    fireEvent.click(screen.getByText('Save Transaction'));
    
    await waitFor(() => {
      expect(mockSaveTransaction).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
    });
  });
}); 