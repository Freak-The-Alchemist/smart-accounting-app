import { Currency } from './Currency';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_money' | 'other';

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface TransactionAttachment {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  description: string;
  date: Date;
  category: TransactionCategory;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  attachments?: TransactionAttachment[];
  notes?: string;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
  accountId: string;
  category: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  byCategory: {
    [categoryId: string]: {
      name: string;
      type: TransactionType;
      total: number;
      count: number;
    };
  };
  byMonth: {
    [month: string]: {
      income: number;
      expenses: number;
      net: number;
    };
  };
  byCurrency: {
    [currency in Currency]: {
      income: number;
      expenses: number;
      net: number;
    };
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: Currency;
  tags?: string[];
  search?: string;
} 