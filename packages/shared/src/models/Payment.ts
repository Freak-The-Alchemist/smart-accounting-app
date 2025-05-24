import { CurrencyCode } from './Currency';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER',
}

export interface PaymentDetails {
  method: PaymentMethod;
  reference?: string;
  transactionId?: string;
  cardDetails?: {
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
  };
  mobileMoneyDetails?: {
    provider: string;
    phoneNumber: string;
  };
}

export interface Payment {
  id: string;
  organizationId: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  details: PaymentDetails;
  description?: string;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
  refundedAmount?: number;
  refundedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSummary {
  total: number;
  byStatus: {
    [status in PaymentStatus]: number;
  };
  byMethod: {
    [method in PaymentMethod]: number;
  };
  byCurrency: {
    [currency in CurrencyCode]?: {
      total: number;
      count: number;
    };
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  revenue: {
    total: number;
    byMethod: {
      [method in PaymentMethod]: number;
    };
    byCurrency: {
      [currency in CurrencyCode]?: number;
    };
  };
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  organizationId?: string;
  currency?: CurrencyCode;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
} 