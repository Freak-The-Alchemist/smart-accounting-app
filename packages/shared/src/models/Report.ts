import { TransactionType, TransactionSummary } from './Transaction';

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  period: {
    start: Date;
    end: Date;
  };
  data: ReportData;
  createdAt: Date;
  updatedAt: Date;
  format?: ReportFormat;
  url?: string;
}

export interface ReportData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
  transactions: {
    income: TransactionSummary[];
    expense: TransactionSummary[];
  };
  categories: {
    [category: string]: {
      amount: number;
      percentage: number;
      type: TransactionType;
    };
  };
  trends: {
    daily?: number[];
    weekly?: number[];
    monthly?: number[];
  };
}

export interface ReportGenerationOptions {
  type: ReportType;
  period: {
    start: Date;
    end: Date;
  };
  format: ReportFormat;
  includeCharts?: boolean;
  includeTransactions?: boolean;
  categories?: string[];
} 