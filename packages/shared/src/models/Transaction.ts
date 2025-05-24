import { CurrencyCode, SUPPORTED_CURRENCIES } from './Currency';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  REFUND = 'REFUND',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  JOURNAL = 'JOURNAL',
  CUSTOM = 'CUSTOM',
}

export enum TransactionStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  ARCHIVED = 'ARCHIVED',
}

export enum TransactionCategory {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  SALARY = 'SALARY',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  TAX = 'TAX',
  INTEREST = 'INTEREST',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
  OTHER = 'OTHER',
}

export interface TransactionLine {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  type: 'DEBIT' | 'CREDIT';
  category?: TransactionCategory;
  tax?: {
    rate: number;
    amount: number;
    type: string;
  };
  metadata?: Record<string, any>;
}

export interface TransactionAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

export interface TransactionApproval {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Transaction {
  id: string;
  organizationId: string;
  type: TransactionType;
  status: TransactionStatus;
  reference: string;
  date: Date;
  description: string;
  amount: number;
  currency: CurrencyCode;
  exchangeRate?: number;
  category?: TransactionCategory;
  lines: TransactionLine[];
  attachments?: TransactionAttachment[];
  approvals?: TransactionApproval[];
  relatedTransactions?: string[];
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
  voidedAt?: Date;
  reversedAt?: Date;
}

export interface TransactionSummary {
  total: number;
  byType: {
    [type in TransactionType]: number;
  };
  byStatus: {
    [status in TransactionStatus]: number;
  };
  byCategory: {
    [category in TransactionCategory]: number;
  };
  byCurrency: {
    [currency in CurrencyCode]: number;
  };
  byPeriod: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
    yearly: Record<string, number>;
  };
  amounts: {
    total: number;
    average: number;
    minimum: number;
    maximum: number;
    byType: Record<TransactionType, number>;
    byCategory: Record<TransactionCategory, number>;
  };
  performance: {
    approvalRate: number;
    averageApprovalTime: number;
    reversalRate: number;
    errorRate: number;
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: TransactionCategory;
  currency?: CurrencyCode;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Validation rules
export const transactionValidationRules = {
  type: {
    required: true,
    enum: Object.values(TransactionType)
  },
  status: {
    required: true,
    enum: Object.values(TransactionStatus)
  },
  reference: {
    required: true,
    minLength: 3,
    maxLength: 50
  },
  date: {
    required: true,
    type: 'date'
  },
  amount: {
    required: true,
    type: 'number',
    min: 0
  },
  currency: {
    required: true,
    enum: SUPPORTED_CURRENCIES
  },
  lines: {
    required: true,
    validate: (lines: TransactionLine[]) => {
      return lines.length > 0 && 
             lines.every(line => 
               line.accountId && 
               line.amount && 
               line.type && 
               line.currency
             ) &&
             lines.reduce((sum, line) => 
               sum + (line.type === 'DEBIT' ? line.amount : -line.amount), 0) === 0;
    },
    message: 'Invalid transaction lines configuration'
  },
  approvals: {
    validate: (approvals: TransactionApproval[]) => {
      return approvals.every(approval => 
        approval.userId && 
        approval.status && 
        approval.timestamp
      );
    },
    message: 'Invalid transaction approvals configuration'
  }
}; 