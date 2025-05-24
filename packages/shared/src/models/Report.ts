import { CurrencyCode } from './Currency';

export enum ReportType {
  BALANCE_SHEET = 'BALANCE_SHEET',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  CASH_FLOW = 'CASH_FLOW',
  TRIAL_BALANCE = 'TRIAL_BALANCE',
  GENERAL_LEDGER = 'GENERAL_LEDGER',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  TAX_SUMMARY = 'TAX_SUMMARY',
  BUDGET_VARIANCE = 'BUDGET_VARIANCE',
  PROFIT_LOSS = 'PROFIT_LOSS',
  CUSTOM = 'CUSTOM',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  JSON = 'JSON',
  HTML = 'HTML',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface ReportData {
  type: ReportType;
  period: ReportPeriod;
  currency: CurrencyCode;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ReportGenerationOptions {
  format: ReportFormat;
  includeCharts?: boolean;
  includeNotes?: boolean;
  includeMetadata?: boolean;
  filters?: Record<string, any>;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  value2?: any; // For between operator
}

export interface ReportColumn {
  field: string;
  header: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'percentage';
  format?: string;
  width?: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  aggregate?: 'sum' | 'average' | 'count' | 'min' | 'max';
}

export interface ReportSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  time?: string;
  days?: string[];
  recipients: string[];
  format: ReportFormat;
  includeAttachments: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  columns: ReportColumn[];
  filters: ReportFilter[];
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  grouping?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }[];
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  organizationId: string;
  createdBy: string;
  template?: ReportTemplate;
  filters: ReportFilter[];
  columns: ReportColumn[];
  data: any[];
  parameters?: Record<string, any>;
  schedule?: ReportSchedule;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSummary {
  total: number;
  byType: {
    [type in ReportType]: number;
  };
  byFormat: {
    [format in ReportFormat]: number;
  };
  byStatus: {
    [status in ReportStatus]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  storage: {
    totalSize: number;
    byFormat: {
      [format in ReportFormat]: number;
    };
  };
  generation: {
    averageTime: number;
    successRate: number;
    byType: {
      [type in ReportType]: {
        count: number;
        averageTime: number;
        successRate: number;
      };
    };
  };
}

export interface ReportFilters {
  type?: ReportType;
  format?: ReportFormat;
  status?: ReportStatus;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const reportValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(ReportType)
  },
  format: {
    required: true,
    enum: Object.values(ReportFormat)
  },
  status: {
    required: true,
    enum: Object.values(ReportStatus)
  },
  filters: {
    validate: (filters: ReportFilter[]) => {
      return filters.every(filter => 
        filter.field && 
        filter.operator && 
        filter.value !== undefined
      );
    },
    message: 'Invalid filter configuration'
  },
  columns: {
    validate: (columns: ReportColumn[]) => {
      return columns.every(column => 
        column.field && 
        column.header && 
        column.type
      );
    },
    message: 'Invalid column configuration'
  }
}; 