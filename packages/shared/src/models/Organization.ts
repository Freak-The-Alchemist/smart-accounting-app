import { CurrencyCode } from './Currency';

export enum OrganizationType {
  CORPORATION = 'CORPORATION',
  PARTNERSHIP = 'PARTNERSHIP',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  LLC = 'LLC',
  NON_PROFIT = 'NON_PROFIT',
  GOVERNMENT = 'GOVERNMENT',
  CUSTOM = 'CUSTOM',
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export enum OrganizationSize {
  MICRO = 'MICRO', // 1-9 employees
  SMALL = 'SMALL', // 10-49 employees
  MEDIUM = 'MEDIUM', // 50-249 employees
  LARGE = 'LARGE', // 250-999 employees
  ENTERPRISE = 'ENTERPRISE', // 1000+ employees
}

export interface OrganizationAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isPrimary: boolean;
  type: 'PHYSICAL' | 'MAILING' | 'BILLING' | 'SHIPPING';
  metadata?: Record<string, any>;
}

export interface OrganizationContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  department?: string;
  role?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationSettings {
  general: {
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    fiscalYearStart: string;
    language: string;
  };
  accounting: {
    chartOfAccounts: string;
    defaultTaxRate: number;
    defaultPaymentTerms: number;
    defaultInvoiceTemplate: string;
    defaultCurrency: string;
    enableMultiCurrency: boolean;
    enableInventory: boolean;
    enableProjects: boolean;
  };
  notifications: {
    channels: string[];
    defaultRecipients: string[];
    templates: Record<string, string>;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays: number;
    };
    sessionPolicy: {
      timeoutMinutes: number;
      maxConcurrentSessions: number;
      requireTwoFactor: boolean;
    };
    ipRestrictions?: string[];
  };
  integrations: {
    [key: string]: {
      enabled: boolean;
      config: Record<string, any>;
    };
  };
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  size: OrganizationSize;
  description?: string;
  website?: string;
  logo?: {
    url: string;
    thumbnail?: string;
    updatedAt: Date;
  };
  addresses: OrganizationAddress[];
  contacts: OrganizationContact[];
  settings: OrganizationSettings;
  departments?: {
    id: string;
    name: string;
    code: string;
    manager?: string;
    parentId?: string;
    metadata?: Record<string, any>;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface OrganizationSummary {
  total: number;
  byType: {
    [type in OrganizationType]: number;
  };
  byStatus: {
    [status in OrganizationStatus]: number;
  };
  bySize: {
    [size in OrganizationSize]: number;
  };
  byCountry: {
    [country: string]: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  activity: {
    activeUsers: number;
    totalTransactions: number;
    totalInvoices: number;
    totalProjects: number;
    lastActivityAt: Date;
  };
  settings: {
    byCurrency: Record<string, number>;
    byLanguage: Record<string, number>;
    byTimezone: Record<string, number>;
  };
}

export interface OrganizationFilters {
  type?: OrganizationType;
  status?: OrganizationStatus;
  size?: OrganizationSize;
  country?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const organizationValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  type: {
    required: true,
    enum: Object.values(OrganizationType)
  },
  status: {
    required: true,
    enum: Object.values(OrganizationStatus)
  },
  size: {
    required: true,
    enum: Object.values(OrganizationSize)
  },
  addresses: {
    required: true,
    validate: (addresses: OrganizationAddress[]) => {
      return addresses.length > 0 && 
             addresses.some(addr => addr.isPrimary) &&
             addresses.every(addr => 
               addr.street && 
               addr.city && 
               addr.state && 
               addr.country && 
               addr.postalCode
             );
    },
    message: 'Invalid organization addresses configuration'
  },
  contacts: {
    required: true,
    validate: (contacts: OrganizationContact[]) => {
      return contacts.length > 0 && 
             contacts.some(contact => contact.isPrimary) &&
             contacts.every(contact => 
               contact.name && 
               contact.title && 
               contact.email && 
               contact.phone
             );
    },
    message: 'Invalid organization contacts configuration'
  },
  settings: {
    required: true,
    validate: (settings: OrganizationSettings) => {
      return settings.general && 
             settings.accounting && 
             settings.notifications && 
             settings.security;
    },
    message: 'Invalid organization settings configuration'
  }
}; 