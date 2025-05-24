import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '../ExportDialog';
import { Transaction } from '../../../../shared/src/models/Transaction';
import { ExportService } from '../../../../shared/src/services/ExportService';

// Mock the ExportService
jest.mock('../../../../shared/src/services/ExportService', () => ({
  ExportService: {
    getInstance: jest.fn(() => ({
      generateReport: jest.fn(),
      exportToExcel: jest.fn().mockResolvedValue(new Blob()),
    })),
  },
}));

describe('ExportDialog', () => {
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

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders export dialog with all options', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    expect(screen.getByText('Export Financial Data')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Include Charts and Visualizations')).toBeInTheDocument();
  });

  it('handles date range selection', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const startDateInput = screen.getByPlaceholderText('Start Date');
    const endDateInput = screen.getByPlaceholderText('End Date');

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    expect(startDateInput).toHaveValue('2024-01-01');
    expect(endDateInput).toHaveValue('2024-01-31');
  });

  it('shows warning toast when end date is before start date', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const startDateInput = screen.getByPlaceholderText('Start Date');
    const endDateInput = screen.getByPlaceholderText('End Date');

    fireEvent.change(startDateInput, { target: { value: '2024-01-31' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
  });

  it('handles category selection', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const categoryCheckbox = screen.getByLabelText('Food');
    fireEvent.click(categoryCheckbox);

    expect(categoryCheckbox).toBeChecked();
  });

  it('handles export with selected options', async () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    // Check loading state
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(ExportService.getInstance().generateReport).toHaveBeenCalled();
      expect(ExportService.getInstance().exportToExcel).toHaveBeenCalled();
    });

    // Check success toast
    expect(screen.getByText('Export completed successfully!')).toBeInTheDocument();

    // Wait for dialog to close
    jest.advanceTimersByTime(1500);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles export failure', async () => {
    const mockError = new Error('Export failed');
    (ExportService.getInstance().exportToExcel as jest.Mock).mockRejectedValueOnce(mockError);

    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to export data. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables all inputs during export', async () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(screen.getByPlaceholderText('Start Date')).toBeDisabled();
    expect(screen.getByPlaceholderText('End Date')).toBeDisabled();
    expect(screen.getByLabelText('Food')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Include Charts and Visualizations')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('closes dialog when close button is clicked', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes dialog when cancel is clicked', () => {
    render(<ExportDialog transactions={mockTransactions} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
}); 