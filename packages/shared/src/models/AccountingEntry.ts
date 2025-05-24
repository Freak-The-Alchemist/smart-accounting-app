import { Currency } from './Currency';

export type AccountType = 
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export type AccountCategory =
  | 'current_asset'
  | 'fixed_asset'
  | 'current_liability'
  | 'long_term_liability'
  | 'owner_equity'
  | 'retained_earnings'
  | 'operating_revenue'
  | 'other_revenue'
  | 'operating_expense'
  | 'other_expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  entries: LedgerEntry[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface LedgerEntry {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  currency: Currency;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalance {
  accountId: string;
  period: {
    start: Date;
    end: Date;
  };
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  currency: Currency;
  lastUpdated: Date;
}

export interface TrialBalance {
  period: {
    start: Date;
    end: Date;
  };
  accounts: {
    accountId: string;
    accountCode: string;
    accountName: string;
    debitBalance: number;
    creditBalance: number;
  }[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  generatedAt: Date;
} 