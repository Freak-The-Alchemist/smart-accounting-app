import { CurrencyCode, SUPPORTED_CURRENCIES } from './Currency';

export enum TaxType {
  INCOME = 'INCOME',
  SALES = 'SALES',
  VAT = 'VAT',
  GST = 'GST',
  CUSTOMS = 'CUSTOMS',
  EXCISE = 'EXCISE',
  PROPERTY = 'PROPERTY',
  PAYROLL = 'PAYROLL',
  OTHER = 'OTHER',
}

export enum TaxStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaxCalculationType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  COMPOUND = 'COMPOUND',
  TIERED = 'TIERED',
}

export interface TaxRate {
  id: string;
  rate: number;
  type: TaxCalculationType;
  effectiveFrom: Date;
  effectiveTo?: Date;
  minimumAmount?: number;
  maximumAmount?: number;
  currency: CurrencyCode;
  metadata?: Record<string, any>;
}

export interface TaxExemption {
  id: string;
  type: string;
  reason: string;
  documentReference?: string;
  approvedBy: string;
  approvedAt: Date;
  validFrom: Date;
  validTo?: Date;
  metadata?: Record<string, any>;
}

export interface TaxPayment {
  id: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: Date;
  paidDate?: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface Tax {
  id: string;
  code: string;
  name: string;
  type: TaxType;
  status: TaxStatus;
  organizationId: string;
  description?: string;
  rates: TaxRate[];
  exemptions?: TaxExemption[];
  payments?: TaxPayment[];
  settings?: {
    isCompound: boolean;
    isInclusive: boolean;
    roundingMethod: 'UP' | 'DOWN' | 'NEAREST';
    reportingFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    dueDateOffset: number;
    latePaymentPenalty?: {
      rate: number;
      type: 'PERCENTAGE' | 'FIXED';
    };
  };
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastCalculatedAt?: Date;
  lastPaidAt?: Date;
}

export interface TaxSummary {
  total: number;
  byType: {
    [type in TaxType]: number;
  };
  byStatus: {
    [status in TaxStatus]: number;
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
    byType: Record<TaxType, number>;
    byStatus: Record<TaxStatus, number>;
  };
  performance: {
    complianceRate: number;
    paymentRate: number;
    exemptionRate: number;
    averagePaymentTime: number;
  };
}

export interface TaxFilters {
  type?: TaxType;
  status?: TaxStatus;
  currency?: CurrencyCode;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Validation rules
export const taxValidationRules = {
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
    enum: Object.values(TaxType)
  },
  status: {
    required: true,
    enum: Object.values(TaxStatus)
  },
  rates: {
    required: true,
    validate: (rates: TaxRate[]) => {
      return rates.length > 0 && 
             rates.every(rate => 
               rate.id && 
               rate.rate >= 0 && 
               rate.type && 
               rate.effectiveFrom && 
               rate.currency
             );
    },
    message: 'Invalid tax rates configuration'
  },
  exemptions: {
    validate: (exemptions: TaxExemption[]) => {
      return exemptions.every(exemption => 
        exemption.id && 
        exemption.type && 
        exemption.reason && 
        exemption.approvedBy && 
        exemption.approvedAt && 
        exemption.validFrom
      );
    },
    message: 'Invalid tax exemptions configuration'
  },
  payments: {
    validate: (payments: TaxPayment[]) => {
      return payments.every(payment => 
        payment.id && 
        payment.amount > 0 && 
        payment.currency && 
        payment.dueDate && 
        payment.status
      );
    },
    message: 'Invalid tax payments configuration'
  },
  settings: {
    validate: (settings: Tax['settings']) => {
      if (!settings) return true;
      return settings.reportingFrequency && 
             settings.dueDateOffset >= 0;
    },
    message: 'Invalid tax settings configuration'
  }
}; 