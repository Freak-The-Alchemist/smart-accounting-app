import { Timestamp } from 'firebase/firestore';
import { CurrencyCode, SUPPORTED_CURRENCIES } from './Currency';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AccountCategory {
  CASH = 'CASH',
  BANK = 'BANK',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  INVENTORY = 'INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  CAPITAL = 'CAPITAL',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  SALES = 'SALES',
  COST_OF_SALES = 'COST_OF_SALES',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  OTHER_INCOME = 'OTHER_INCOME',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export interface AccountBalance {
  accountId: string;
  balance: number;
  currency: CurrencyCode;
  lastUpdated: Date;
  period: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface AccountTransaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: CurrencyCode;
  date: Date;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface AccountReconciliation {
  id: string;
  date: Date;
  balance: number;
  currency: CurrencyCode;
  status: 'PENDING' | 'COMPLETED' | 'DISPUTED';
  reconciledBy: string;
  reconciledAt: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  status: AccountStatus;
  description?: string;
  parentId?: string;
  currency: CurrencyCode;
  organizationId: string;
  balances: AccountBalance[];
  transactions: AccountTransaction[];
  reconciliations: AccountReconciliation[];
  settings?: {
    allowNegativeBalance: boolean;
    requireApproval: boolean;
    approvalThreshold?: number;
    autoReconcile: boolean;
    notifications: {
      lowBalance?: number;
      highBalance?: number;
      unusualActivity?: boolean;
    };
  };
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastReconciledAt?: Date;
  lastTransactionAt?: Date;
}

export interface AccountSummary {
  total: number;
  byType: {
    [type in AccountType]: number;
  };
  byStatus: {
    [status in AccountStatus]: number;
  };
  byCategory: {
    [category in AccountCategory]: number;
  };
  byCurrency: {
    [currency in CurrencyCode]: number;
  };
  balances: {
    total: number;
    average: number;
    minimum: number;
    maximum: number;
    byType: Record<AccountType, number>;
    byCategory: Record<AccountCategory, number>;
  };
  activity: {
    totalTransactions: number;
    pendingReconciliations: number;
    lastReconciliationDate?: Date;
    lastTransactionDate?: Date;
  };
  performance: {
    reconciliationRate: number;
    averageReconciliationTime: number;
    errorRate: number;
    complianceRate: number;
  };
}

export interface AccountFilters {
  type?: AccountType;
  status?: AccountStatus;
  category?: AccountCategory;
  currency?: CurrencyCode;
  parentId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const accountValidationRules = {
  code: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9_-]+$/
  },
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  type: {
    required: true,
    enum: Object.values(AccountType)
  },
  category: {
    required: true,
    enum: Object.values(AccountCategory)
  },
  status: {
    required: true,
    enum: Object.values(AccountStatus)
  },
  currency: {
    required: true,
    enum: SUPPORTED_CURRENCIES
  },
  balances: {
    validate: (balances: AccountBalance[]) => {
      return balances.every(balance => 
        balance.accountId && 
        typeof balance.balance === 'number' && 
        balance.currency && 
        balance.lastUpdated
      );
    },
    message: 'Invalid account balances configuration'
  },
  transactions: {
    validate: (transactions: AccountTransaction[]) => {
      return transactions.every(transaction => 
        transaction.id && 
        transaction.type && 
        typeof transaction.amount === 'number' && 
        transaction.currency && 
        transaction.date
      );
    },
    message: 'Invalid account transactions configuration'
  },
  reconciliations: {
    validate: (reconciliations: AccountReconciliation[]) => {
      return reconciliations.every(reconciliation => 
        reconciliation.id && 
        reconciliation.date && 
        typeof reconciliation.balance === 'number' && 
        reconciliation.currency && 
        reconciliation.status && 
        reconciliation.reconciledBy && 
        reconciliation.reconciledAt
      );
    },
    message: 'Invalid account reconciliations configuration'
  }
}; 