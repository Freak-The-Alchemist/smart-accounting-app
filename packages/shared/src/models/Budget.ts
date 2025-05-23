import { Currency } from './Currency';

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type BudgetStatus = 'on_track' | 'at_risk' | 'exceeded';

export interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  status: BudgetStatus;
  transactions: string[]; // Transaction IDs
}

export interface Budget {
  id: string;
  name: string;
  description?: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  currency: Currency;
  totalAmount: number;
  totalSpent: number;
  totalRemaining: number;
  status: BudgetStatus;
  categories: BudgetCategory[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notifications: {
    enabled: boolean;
    threshold: number; // Percentage
    recipients: string[];
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  byCategory: {
    [categoryId: string]: {
      name: string;
      budgeted: number;
      spent: number;
      remaining: number;
      status: BudgetStatus;
    };
  };
  byPeriod: {
    [period: string]: {
      budgeted: number;
      spent: number;
      remaining: number;
    };
  };
  statusBreakdown: {
    [status in BudgetStatus]: number;
  };
} 