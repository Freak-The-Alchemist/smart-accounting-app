import React from 'react';
import { render, screen } from '@testing-library/react';
import { OCRStatus } from '../OCRStatus';

describe('OCRStatus', () => {
  it('renders processing status with progress', () => {
    render(
      <OCRStatus
        status="processing"
        progress={50}
      />
    );
    
    expect(screen.getByText('Processing receipt...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders success status', () => {
    render(
      <OCRStatus
        status="success"
      />
    );
    
    expect(screen.getByText('Receipt processed successfully!')).toBeInTheDocument();
  });

  it('renders error status with message', () => {
    const errorMessage = 'Failed to process image';
    render(
      <OCRStatus
        status="error"
        error={errorMessage}
      />
    );
    
    expect(screen.getByText('Error processing receipt')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Please try again or upload a clearer image.')).toBeInTheDocument();
  });

  it('renders idle status without any message', () => {
    render(
      <OCRStatus
        status="idle"
      />
    );
    
    expect(screen.queryByText(/Processing receipt/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Receipt processed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error processing/)).not.toBeInTheDocument();
  });
}); 