import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../../store/slices/authSlice';
import { expenseReducer } from '../../store/slices/expenseSlice';
import ExpenseManagement from '../../pages/ExpenseManagement';
import { PetrolStationService } from '@smart-accounting/shared/services/petrolStation';
import { OCRService } from '@smart-accounting/shared/utils/ocr';

// Mock services
jest.mock('@smart-accounting/shared/services/petrolStation');
jest.mock('@smart-accounting/shared/utils/ocr');

describe('Expense Management E2E', () => {
  let store: any;
  let mockPetrolStationService: jest.Mocked<PetrolStationService>;
  let mockOCRService: jest.Mocked<OCRService>;

  beforeEach(() => {
    // Initialize store
    store = configureStore({
      reducer: {
        auth: authReducer,
        expense: expenseReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 'test-user',
            name: 'Test User',
            role: 'manager',
          },
          loading: false,
          error: null,
        },
        expense: {
          expenses: [],
          loading: false,
          error: null,
        },
      },
    });

    // Mock services
    mockPetrolStationService = {
      createExpense: jest.fn(),
      getExpenses: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
    } as any;

    mockOCRService = {
      processImage: jest.fn(),
      extractReceiptData: jest.fn(),
    } as any;

    (PetrolStationService as jest.Mock).mockImplementation(() => mockPetrolStationService);
    (OCRService as jest.Mock).mockImplementation(() => mockOCRService);
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ExpenseManagement />
        </BrowserRouter>
      </Provider>
    );
  };

  it('should handle manual expense entry flow', async () => {
    renderComponent();

    // Click "Add Expense" button
    const addButton = screen.getByText('Add Expense');
    fireEvent.click(addButton);

    // Fill in expense form
    const amountInput = screen.getByLabelText('Amount');
    const descriptionInput = screen.getByLabelText('Description');
    const dateInput = screen.getByLabelText('Date');

    await userEvent.type(amountInput, '100.50');
    await userEvent.type(descriptionInput, 'Test Expense');
    await userEvent.type(dateInput, '2024-01-01');

    // Submit form
    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    // Verify service call
    await waitFor(() => {
      expect(mockPetrolStationService.createExpense).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: 100.50,
          description: 'Test Expense',
          date: expect.any(Date),
        })
      );
    });

    // Verify success message
    expect(screen.getByText('Expense added successfully')).toBeInTheDocument();
  });

  it('should handle receipt scanning flow', async () => {
    renderComponent();

    // Mock file input
    const file = new File(['test image'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('Upload Receipt');

    // Mock OCR result
    mockOCRService.extractReceiptData.mockResolvedValue({
      total: 150.75,
      date: '01/01/2024',
      items: [
        { description: 'Item 1', amount: 50.25 },
        { description: 'Item 2', amount: 100.50 },
      ],
    });

    // Upload file
    await userEvent.upload(fileInput, file);

    // Verify OCR processing
    await waitFor(() => {
      expect(mockOCRService.extractReceiptData).toHaveBeenCalled();
    });

    // Verify form is populated with OCR data
    expect(screen.getByLabelText('Amount')).toHaveValue('150.75');
    expect(screen.getByLabelText('Date')).toHaveValue('2024-01-01');

    // Submit form
    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    // Verify service call
    await waitFor(() => {
      expect(mockPetrolStationService.createExpense).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: 150.75,
          date: expect.any(Date),
          items: [
            { description: 'Item 1', amount: 50.25 },
            { description: 'Item 2', amount: 100.50 },
          ],
        })
      );
    });
  });

  it('should handle expense list and filtering', async () => {
    // Mock expenses data
    const mockExpenses = [
      {
        id: '1',
        amount: 100.50,
        description: 'Test Expense 1',
        date: new Date('2024-01-01'),
        status: 'pending',
      },
      {
        id: '2',
        amount: 200.75,
        description: 'Test Expense 2',
        date: new Date('2024-01-02'),
        status: 'approved',
      },
    ];

    mockPetrolStationService.getExpenses.mockResolvedValue(mockExpenses);

    renderComponent();

    // Verify expenses are loaded
    await waitFor(() => {
      expect(screen.getByText('Test Expense 1')).toBeInTheDocument();
      expect(screen.getByText('Test Expense 2')).toBeInTheDocument();
    });

    // Filter by status
    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Test Expense 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Expense 2')).not.toBeInTheDocument();
    });
  });

  it('should handle expense approval flow', async () => {
    // Mock expenses data
    const mockExpenses = [
      {
        id: '1',
        amount: 100.50,
        description: 'Test Expense',
        date: new Date('2024-01-01'),
        status: 'pending',
      },
    ];

    mockPetrolStationService.getExpenses.mockResolvedValue(mockExpenses);
    mockPetrolStationService.updateExpense.mockResolvedValue({
      ...mockExpenses[0],
      status: 'approved',
    });

    renderComponent();

    // Wait for expense to load
    await waitFor(() => {
      expect(screen.getByText('Test Expense')).toBeInTheDocument();
    });

    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Verify service call
    await waitFor(() => {
      expect(mockPetrolStationService.updateExpense).toHaveBeenCalledWith(
        expect.any(String),
        '1',
        { status: 'approved' }
      );
    });

    // Verify status update
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
}); 