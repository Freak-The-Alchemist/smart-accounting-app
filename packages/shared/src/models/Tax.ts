export enum TaxType {
  INCOME = 'INCOME',
  VAT = 'VAT',
  CORPORATE = 'CORPORATE',
  PROPERTY = 'PROPERTY',
  SALES = 'SALES',
  CUSTOM = 'CUSTOM',
}

export enum TaxStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface Tax {
  id: string;
  type: TaxType;
  amount: number;
  description: string;
  dueDate: Date;
  category: string;
  status: TaxStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxRate {
  minIncome: number;
  maxIncome: number;
  rate: number;
}

export interface TaxCalculation {
  income: number;
  taxYear: string;
  taxAmount: number;
  taxRate: number;
  taxBrackets: TaxRate[];
}

export interface TaxSummary {
  totalTaxes: number;
  paidTaxes: number;
  pendingTaxes: number;
  taxesByCategory: Record<string, number>;
  taxesByType: Record<TaxType, number>;
}

export type TaxRateType = 
  | 'percentage'
  | 'fixed';

export interface TaxRate {
  id: string;
  type: TaxType;
  name: string;
  rateType: TaxRateType;
  rate: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxTransaction {
  id: string;
  type: TaxType;
  amount: number;
  taxAmount: number;
  currency: string;
  date: Date;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  reference?: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    source?: string;
    attachments?: string[];
    notes?: string;
  };
}

export interface TaxReport {
  id: string;
  type: TaxType;
  period: {
    start: Date;
    end: Date;
  };
  totalAmount: number;
  totalTax: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  transactions: TaxTransaction[];
  metadata?: {
    reportNumber?: string;
    taxAuthority?: string;
    attachments?: string[];
    notes?: string;
  };
}

// Validation rules
export const taxRateValidationRules = {
  type: {
    required: true,
    enum: ['income_tax', 'vat', 'withholding_tax', 'payroll_tax', 'custom']
  },
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  rateType: {
    required: true,
    enum: ['percentage', 'fixed']
  },
  rate: {
    required: true,
    validate: (value: number) => value >= 0,
    message: 'Rate must be a non-negative number'
  },
  effectiveFrom: {
    required: true
  }
};

export const taxTransactionValidationRules = {
  type: {
    required: true,
    enum: ['income_tax', 'vat', 'withholding_tax', 'payroll_tax', 'custom']
  },
  amount: {
    required: true,
    validate: (value: number) => value > 0,
    message: 'Amount must be greater than 0'
  },
  taxAmount: {
    required: true,
    validate: (value: number) => value >= 0,
    message: 'Tax amount must be a non-negative number'
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/,
    message: 'Currency must be a 3-letter code (e.g., KES)'
  },
  date: {
    required: true
  },
  dueDate: {
    required: true
  }
};

export const taxReportValidationRules = {
  type: {
    required: true,
    enum: ['income_tax', 'vat', 'withholding_tax', 'payroll_tax', 'custom']
  },
  period: {
    required: true,
    validate: (value: { start: Date; end: Date }) => 
      value.start instanceof Date && 
      value.end instanceof Date && 
      value.start <= value.end,
    message: 'Period must have valid start and end dates'
  },
  totalAmount: {
    required: true,
    validate: (value: number) => value >= 0,
    message: 'Total amount must be a non-negative number'
  },
  totalTax: {
    required: true,
    validate: (value: number) => value >= 0,
    message: 'Total tax must be a non-negative number'
  },
  currency: {
    required: true,
    pattern: /^[A-Z]{3}$/,
    message: 'Currency must be a 3-letter code (e.g., KES)'
  }
}; 