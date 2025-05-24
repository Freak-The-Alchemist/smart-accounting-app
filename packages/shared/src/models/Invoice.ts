import { CurrencyCode, SUPPORTED_CURRENCIES } from './Currency';
import { PaymentMethod } from './Payment';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED',
  ARCHIVED = 'ARCHIVED',
}

export enum InvoiceType {
  STANDARD = 'STANDARD',
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  RECURRING = 'RECURRING',
  PRO_FORMA = 'PRO_FORMA',
  CUSTOM = 'CUSTOM',
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: CurrencyCode;
  tax?: {
    rate: number;
    amount: number;
    type: string;
  };
  discount?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    amount: number;
  };
  total: number;
  metadata?: Record<string, any>;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  date: Date;
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  organizationId: string;
  customerId: string;
  date: Date;
  dueDate: Date;
  currency: CurrencyCode;
  exchangeRate?: number;
  items: InvoiceItem[];
  subtotal: number;
  tax: {
    total: number;
    details: {
      type: string;
      rate: number;
      amount: number;
    }[];
  };
  discount?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    amount: number;
  };
  total: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  terms?: string;
  payments: InvoicePayment[];
  attachments?: InvoiceAttachment[];
  recurring?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate: Date;
    endDate?: Date;
    lastGenerated?: Date;
    nextDue?: Date;
  };
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
  voidedAt?: Date;
}

export interface InvoiceSummary {
  total: number;
  byType: {
    [type in InvoiceType]: number;
  };
  byStatus: {
    [status in InvoiceStatus]: number;
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
    byType: Record<InvoiceType, number>;
    byStatus: Record<InvoiceStatus, number>;
  };
  performance: {
    averagePaymentTime: number;
    overdueRate: number;
    collectionRate: number;
    disputeRate: number;
  };
}

export interface InvoiceFilters {
  type?: InvoiceType;
  status?: InvoiceStatus;
  currency?: CurrencyCode;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Validation rules
export const invoiceValidationRules = {
  number: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9_-]+$/
  },
  type: {
    required: true,
    enum: Object.values(InvoiceType)
  },
  status: {
    required: true,
    enum: Object.values(InvoiceStatus)
  },
  date: {
    required: true,
    type: 'date'
  },
  dueDate: {
    required: true,
    type: 'date',
    validate: (value: Date, data: Invoice) => {
      return value >= data.date;
    },
    message: 'Due date must be after or equal to invoice date'
  },
  currency: {
    required: true,
    enum: SUPPORTED_CURRENCIES
  },
  items: {
    required: true,
    validate: (items: InvoiceItem[]) => {
      return items.length > 0 && 
             items.every(item => 
               item.description && 
               item.quantity > 0 && 
               item.unitPrice >= 0 && 
               item.total >= 0
             );
    },
    message: 'Invalid invoice items configuration'
  },
  payments: {
    validate: (payments: InvoicePayment[]) => {
      return payments.every(payment => 
        payment.id && 
        payment.amount > 0 && 
        payment.currency && 
        payment.method && 
        payment.status && 
        payment.date
      );
    },
    message: 'Invalid invoice payments configuration'
  },
  recurring: {
    validate: (recurring: Invoice['recurring']) => {
      if (!recurring) return true;
      return recurring.frequency && 
             recurring.startDate && 
             (!recurring.endDate || recurring.endDate >= recurring.startDate);
    },
    message: 'Invalid recurring invoice configuration'
  }
}; 