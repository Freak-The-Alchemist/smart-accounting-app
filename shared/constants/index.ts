export const APP_NAME = 'Smart Accounting';

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export const DEFAULT_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export const DEFAULT_CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Investments',
    'Gifts',
    'Other Income'
  ],
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Other Expenses'
  ]
} as const;

export const STORAGE_PATHS = {
  RECEIPTS: 'receipts',
  PROFILE_PICTURES: 'profile-pictures'
} as const;

export const ERROR_MESSAGES = {
  AUTHENTICATION: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    EMAIL_IN_USE: 'Email is already in use',
    WEAK_PASSWORD: 'Password should be at least 6 characters',
    INVALID_EMAIL: 'Invalid email format'
  },
  TRANSACTIONS: {
    INVALID_AMOUNT: 'Amount must be greater than 0',
    INVALID_DATE: 'Invalid date',
    INVALID_CATEGORY: 'Invalid category',
    NOT_FOUND: 'Transaction not found'
  },
  RECEIPTS: {
    UPLOAD_FAILED: 'Failed to upload receipt',
    INVALID_FORMAT: 'Invalid file format',
    FILE_TOO_LARGE: 'File size exceeds limit',
    NOT_FOUND: 'Receipt not found'
  }
} as const; 