import { Account, AccountType } from './Account';
import { CurrencyCode } from './Currency';

export interface ChartOfAccounts {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  currency: CurrencyCode;
  fiscalYearStart: string; // MM-DD format
  fiscalYearEnd: string; // MM-DD format
  accounts: Account[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartOfAccountsSummary {
  total: number;
  byType: {
    [type in AccountType]: {
      total: number;
      count: number;
    };
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
}

export interface ChartOfAccountsFilters {
  organizationId?: string;
  currency?: CurrencyCode;
  isActive?: boolean;
  search?: string;
} 