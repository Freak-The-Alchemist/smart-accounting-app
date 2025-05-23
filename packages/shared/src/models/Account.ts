import { Timestamp } from 'firebase/firestore';

export type AccountType = 
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export type AccountCategory =
  | 'cash'
  | 'bank'
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'inventory'
  | 'fixed_asset'
  | 'current_liability'
  | 'long_term_liability'
  | 'capital'
  | 'retained_earnings'
  | 'sales'
  | 'cost_of_sales'
  | 'operating_expense'
  | 'other_income'
  | 'other_expense';

export interface Account {
  id: string;
  code: string;           // Account code (e.g., "1000" for Cash)
  name: string;           // Account name
  type: AccountType;      // Account type (asset, liability, etc.)
  category: AccountCategory; // Account category
  description?: string;   // Optional description
  isActive: boolean;      // Whether the account is active
  balance: number;        // Current balance
  currency: string;       // Currency code (e.g., "KES")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;      // User ID
  organizationId: string; // Organization ID
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  lastUpdated: Timestamp;
}

// Validation rules
export const accountValidationRules = {
  code: {
    required: true,
    pattern: /^\d{4,6}$/, // 4-6 digit account code
    message: 'Account code must be 4-6 digits'
  },
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  type: {
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  category: {
    required: true
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/, // 3-letter currency code
    message: 'Currency must be a 3-letter code (e.g., KES)'
  }
}; 