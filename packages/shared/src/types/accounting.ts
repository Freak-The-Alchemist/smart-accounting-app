export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  code: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  entries: JournalEntryLine[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
  accountId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  receiptUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  accountId: string;
  isActive: boolean;
}

export interface ChartOfAccounts {
  id: string;
  name: string;
  accounts: Account[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialStatement {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  period: {
    start: Date;
    end: Date;
  };
  data: BalanceSheet | IncomeStatement | CashFlowStatement;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceSheet {
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
      otherCurrentAssets: number;
    };
    fixed: {
      property: number;
      equipment: number;
      vehicles: number;
      otherFixedAssets: number;
    };
    other: {
      investments: number;
      intangibleAssets: number;
      otherAssets: number;
    };
  };
  liabilities: {
    current: {
      accountsPayable: number;
      shortTermLoans: number;
      accruedExpenses: number;
      otherCurrentLiabilities: number;
    };
    longTerm: {
      longTermLoans: number;
      bonds: number;
      otherLongTermLiabilities: number;
    };
  };
  equity: {
    commonStock: number;
    retainedEarnings: number;
    otherEquity: number;
  };
}

export interface IncomeStatement {
  revenue: {
    sales: number;
    service: number;
    other: number;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    depreciation: number;
    other: number;
  };
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
}

export interface CashFlowStatement {
  operating: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      accountsReceivable: number;
      inventory: number;
      accountsPayable: number;
      other: number;
    };
    netCashFromOperations: number;
  };
  investing: {
    purchaseOfAssets: number;
    saleOfAssets: number;
    investments: number;
    other: number;
    netCashFromInvesting: number;
  };
  financing: {
    loans: number;
    repayments: number;
    dividends: number;
    other: number;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

export type AccountingEntry = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for fuel station mode
  pumpNumber?: number;
  fuelType?: string;
  shiftId?: string;
};

export type ChartOfAccounts = {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  date: Date;
  description: string;
  entries: TransactionEntry[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for fuel station mode
  shiftId?: string;
  pumpNumber?: number;
};

export type TransactionEntry = {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
};

export type FinancialStatement = {
  id: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow';
  period: {
    start: Date;
    end: Date;
  };
  data: {
    [key: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
}; 