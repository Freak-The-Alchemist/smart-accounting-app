import { Timestamp } from 'firebase/firestore';
import { Account } from './Account';
import { Currency } from './Currency';

export enum JournalEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  type: JournalEntryType;
  amount: number;
  currency: Currency;
  description?: string;
  reference?: string;
}

export interface JournalEntry {
  id: string;
  number: string;
  date: Date;
  type: JournalEntryType;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  total: number;
  currency: Currency;
  description?: string;
  reference?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
  voidedAt?: Date;
}

export interface JournalEntrySummary {
  total: number;
  byStatus: {
    [status in JournalEntryStatus]: number;
  };
  byType: {
    [type in JournalEntryType]: number;
  };
  byMonth: {
    [month: string]: {
      total: number;
      count: number;
    };
  };
}

export interface JournalEntryFilters {
  status?: JournalEntryStatus;
  type?: JournalEntryType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: Currency;
  search?: string;
}

// Validation rules
export const journalEntryValidationRules = {
  date: {
    required: true
  },
  reference: {
    required: true,
    pattern: /^[A-Z0-9-]+$/,
    message: 'Reference must contain only uppercase letters, numbers, and hyphens'
  },
  description: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  lines: {
    required: true,
    minLength: 2,
    validate: (lines: JournalEntryLine[]) => {
      // Validate that debits equal credits
      const totalDebits = lines
        .filter(line => line.type === 'debit')
        .reduce((sum, line) => sum + line.amount, 0);
      
      const totalCredits = lines
        .filter(line => line.type === 'credit')
        .reduce((sum, line) => sum + line.amount, 0);
      
      return totalDebits === totalCredits;
    },
    message: 'Total debits must equal total credits'
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/,
    message: 'Currency must be a 3-letter code (e.g., KES)'
  }
}; 