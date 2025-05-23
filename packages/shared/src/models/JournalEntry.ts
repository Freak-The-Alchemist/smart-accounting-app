import { Timestamp } from 'firebase/firestore';
import { Account } from './Account';

export type EntryType = 'debit' | 'credit';

export interface JournalEntryLine {
  accountId: string;
  account?: Account;  // Populated when fetching
  type: EntryType;
  amount: number;
  currency: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: Timestamp;
  reference: string;        // Transaction reference number
  description: string;
  lines: JournalEntryLine[];
  totalAmount: number;
  currency: string;
  status: 'draft' | 'posted' | 'void';
  type: 'regular' | 'adjustment' | 'closing';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  organizationId: string;
  metadata?: {
    source?: string;        // e.g., 'manual', 'ocr', 'voice'
    attachments?: string[]; // URLs to attached documents
    notes?: string;
  };
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