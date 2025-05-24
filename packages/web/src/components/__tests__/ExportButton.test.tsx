import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import { Transaction } from '../../../../shared/src/models/Transaction';

describe('ExportButton', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: new Date('2024-01-01'),
      description: 'Test Transaction',
      amount: 100,
      type: 'expense',
      category: 'Food',
      currency: 'KES',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1',
      updatedBy: 'user1',
      status: 'completed',
    },
  ];

  it('renders export button', () => {
    render(<ExportButton transactions={mockTransactions} />);
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('opens export dialog when button is clicked', () => {
    render(<ExportButton transactions={mockTransactions} />);
    
    const button = screen.getByText('Export Data');
    fireEvent.click(button);

    expect(screen.getByText('Export Financial Data')).toBeInTheDocument();
  });

  it('closes export dialog when close is clicked', () => {
    render(<ExportButton transactions={mockTransactions} />);
    
    // Open dialog
    const button = screen.getByText('Export Data');
    fireEvent.click(button);

    // Close dialog
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);

    // Dialog should be closed
    expect(screen.queryByText('Export Financial Data')).not.toBeInTheDocument();
  });
}); 