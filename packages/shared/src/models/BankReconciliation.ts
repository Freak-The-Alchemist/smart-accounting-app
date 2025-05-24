import { Timestamp } from 'firebase/firestore';
import { Account } from './Account';
import { JournalEntry } from './JournalEntry';
import { Currency, CurrencyCode } from './Currency';

export interface BankStatementLine {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  status: 'matched' | 'unmatched';
  matchedEntryId?: string;
}

export enum BankReconciliationStatus {
  PENDING = 'PENDING',
  RECONCILED = 'RECONCILED',
  DISPUTED = 'DISPUTED',
}

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  status: BankReconciliationStatus;
  metadata?: Record<string, any>;
}

export interface BankReconciliation {
  id: string;
  accountId: string;
  account?: Account;  // Populated when fetching
  statementDate: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  status: BankReconciliationStatus;
  currency: CurrencyCode;
  notes?: string;
  attachments?: string[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  reconciledAt?: Date;
  metadata?: Record<string, any>;
  reconciliationSummary: {
    totalCredits: number;
    totalDebits: number;
    outstandingDeposits: number;
    outstandingChecks: number;
    bankCharges: number;
    interestEarned: number;
    adjustments: number;
  };
}

export interface BankReconciliationSummary {
  total: number;
  byStatus: {
    [status in BankReconciliationStatus]: number;
  };
  byMonth: {
    [month: string]: {
      total: number;
      count: number;
    };
  };
  byAccount: {
    [accountId: string]: {
      total: number;
      count: number;
    };
  };
  byCurrency: {
    [currency in CurrencyCode]?: {
      total: number;
      count: number;
    };
  };
}

export interface BankReconciliationFilters {
  status?: BankReconciliationStatus;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: CurrencyCode;
  search?: string;
}

// Validation rules
export const bankReconciliationValidationRules = {
  accountId: {
    required: true
  },
  statementDate: {
    required: true
  },
  openingBalance: {
    required: true,
    validate: (value: number) => !isNaN(value),
    message: 'Opening balance must be a valid number'
  },
  closingBalance: {
    required: true,
    validate: (value: number) => !isNaN(value),
    message: 'Closing balance must be a valid number'
  },
  transactions: {
    required: true,
    validate: (transactions: BankTransaction[]) => {
      // Validate that all transactions have required fields
      return transactions.every(transaction => 
        transaction.date && 
        transaction.description && 
        !isNaN(transaction.amount) &&
        ['credit', 'debit'].includes(transaction.type)
      );
    },
    message: 'All transactions must have valid date, description, amount, and type'
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/,
    message: 'Currency must be a 3-letter code (e.g., KES)'
  }
}; 