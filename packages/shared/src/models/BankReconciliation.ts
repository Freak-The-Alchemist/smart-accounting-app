import { Timestamp } from 'firebase/firestore';
import { Account } from './Account';
import { JournalEntry } from './JournalEntry';

export interface BankStatementLine {
  date: Date;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference?: string;
  status: 'matched' | 'unmatched';
  matchedEntryId?: string;
}

export interface BankReconciliation {
  id: string;
  accountId: string;
  account?: Account;  // Populated when fetching
  statementDate: Date;
  openingBalance: number;
  closingBalance: number;
  statementLines: BankStatementLine[];
  status: 'draft' | 'in_progress' | 'completed';
  currency: string;
  organizationId: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  metadata?: {
    statementNumber?: string;
    bankName?: string;
    notes?: string;
    attachments?: string[]; // URLs to bank statements
  };
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
  statementLines: {
    required: true,
    validate: (lines: BankStatementLine[]) => {
      // Validate that all lines have required fields
      return lines.every(line => 
        line.date && 
        line.description && 
        !isNaN(line.amount) &&
        ['credit', 'debit'].includes(line.type)
      );
    },
    message: 'All statement lines must have valid date, description, amount, and type'
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/,
    message: 'Currency must be a 3-letter code (e.g., KES)'
  }
}; 