import React from 'react';
import { render } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { TransactionProvider } from '../../../shared/contexts/TransactionContext';
import { AuthProvider } from '../../../shared/contexts/AuthContext';

// Mock the hooks and services
jest.mock('../../../shared/hooks/useTransactions', () => ({
  useTransactions: () => ({
    transactions: [],
    loading: false,
    error: null,
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
  }),
}));

jest.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
    error: null,
  }),
}));

describe('Dashboard Component', () => {
  it('should render correctly', () => {
    const { container } = render(
      <AuthProvider>
        <TransactionProvider>
          <Dashboard />
        </TransactionProvider>
      </AuthProvider>
    );

    expect(container).toMatchSnapshot();
  });

  it('should display loading state', () => {
    jest.spyOn(require('../../../shared/hooks/useTransactions'), 'useTransactions')
      .mockImplementation(() => ({
        transactions: [],
        loading: true,
        error: null,
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
      }));

    const { container } = render(
      <AuthProvider>
        <TransactionProvider>
          <Dashboard />
        </TransactionProvider>
      </AuthProvider>
    );

    expect(container).toMatchSnapshot();
  });

  it('should display error state', () => {
    jest.spyOn(require('../../../shared/hooks/useTransactions'), 'useTransactions')
      .mockImplementation(() => ({
        transactions: [],
        loading: false,
        error: 'Failed to load transactions',
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
      }));

    const { container } = render(
      <AuthProvider>
        <TransactionProvider>
          <Dashboard />
        </TransactionProvider>
      </AuthProvider>
    );

    expect(container).toMatchSnapshot();
  });

  it('should display transactions data', () => {
    const mockTransactions = [
      {
        id: '1',
        type: 'income',
        amount: 1000,
        description: 'Salary',
        date: new Date(),
        category: 'income',
        currency: 'KES',
        status: 'completed',
      },
      {
        id: '2',
        type: 'expense',
        amount: 500,
        description: 'Rent',
        date: new Date(),
        category: 'expenses',
        currency: 'KES',
        status: 'completed',
      },
    ];

    jest.spyOn(require('../../../shared/hooks/useTransactions'), 'useTransactions')
      .mockImplementation(() => ({
        transactions: mockTransactions,
        loading: false,
        error: null,
        totalIncome: 1000,
        totalExpenses: 500,
        netAmount: 500,
      }));

    const { container } = render(
      <AuthProvider>
        <TransactionProvider>
          <Dashboard />
        </TransactionProvider>
      </AuthProvider>
    );

    expect(container).toMatchSnapshot();
  });

  it('should handle currency conversion', () => {
    const mockTransactions = [
      {
        id: '1',
        type: 'income',
        amount: 1000,
        description: 'Salary',
        date: new Date(),
        category: 'income',
        currency: 'USD',
        status: 'completed',
      },
    ];

    jest.spyOn(require('../../../shared/hooks/useTransactions'), 'useTransactions')
      .mockImplementation(() => ({
        transactions: mockTransactions,
        loading: false,
        error: null,
        totalIncome: 1000,
        totalExpenses: 0,
        netAmount: 1000,
      }));

    const { container } = render(
      <AuthProvider>
        <TransactionProvider>
          <Dashboard />
        </TransactionProvider>
      </AuthProvider>
    );

    expect(container).toMatchSnapshot();
  });
}); 