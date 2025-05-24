import { CurrencyCode } from './Currency';

export enum BudgetType {
  OPERATING = 'OPERATING',
  CAPITAL = 'CAPITAL',
  CASH_FLOW = 'CASH_FLOW',
  PROJECT = 'PROJECT',
  DEPARTMENT = 'DEPARTMENT',
  MASTER = 'MASTER',
}

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export interface BudgetCategory {
  id: string;
  name: string;
  code: string;
  type: 'income' | 'expense';
  parentId?: string;
  children?: string[];
  description?: string;
  metadata?: Record<string, any>;
}

export interface BudgetLineItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  period: {
    startDate: Date;
    endDate: Date;
  };
  type: 'fixed' | 'variable';
  allocation?: {
    method: 'equal' | 'percentage' | 'custom';
    values?: Record<string, number>;
  };
  adjustments?: {
    date: Date;
    amount: number;
    reason: string;
    approvedBy: string;
  }[];
  metadata?: Record<string, any>;
}

export interface BudgetApproval {
  id: string;
  level: number;
  status: 'pending' | 'approved' | 'rejected';
  approverId: string;
  approverRole: string;
  comments?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  metadata?: Record<string, any>;
}

export interface BudgetVariance {
  categoryId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  planned: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
  analysis?: string;
  recommendations?: string[];
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  type: BudgetType;
  status: BudgetStatus;
  organizationId: string;
  createdBy: string;
  period: {
    type: BudgetPeriod;
    startDate: Date;
    endDate: Date;
  };
  currency: CurrencyCode;
  categories: BudgetCategory[];
  lineItems: BudgetLineItem[];
  totalPlanned: number;
  totalActual?: number;
  totalVariance?: number;
  approvals: BudgetApproval[];
  variances?: BudgetVariance[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetSummary {
  total: number;
  byType: {
    [type in BudgetType]: number;
  };
  byStatus: {
    [status in BudgetStatus]: number;
  };
  byPeriod: {
    [period in BudgetPeriod]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  financials: {
    totalPlanned: number;
    totalActual: number;
    totalVariance: number;
    byCategory: {
      [categoryId: string]: {
        planned: number;
        actual: number;
        variance: number;
      };
    };
  };
  performance: {
    averageVariance: number;
    varianceTrend: number;
    categories: {
      [categoryId: string]: {
        variance: number;
        trend: number;
      };
    };
  };
}

export interface BudgetFilters {
  type?: BudgetType;
  status?: BudgetStatus;
  period?: BudgetPeriod;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  search?: string;
}

// Validation rules
export const budgetValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(BudgetType)
  },
  status: {
    required: true,
    enum: Object.values(BudgetStatus)
  },
  period: {
    validate: (period: { type: BudgetPeriod; startDate: Date; endDate: Date }) => {
      if (!period.startDate || !period.endDate) return false;
      return period.startDate < period.endDate;
    },
    message: 'Invalid budget period'
  },
  lineItems: {
    validate: (items: BudgetLineItem[]) => {
      return items.every(item => 
        item.categoryId && 
        item.amount > 0 && 
        item.currency
      );
    },
    message: 'Invalid budget line items'
  }
}; 