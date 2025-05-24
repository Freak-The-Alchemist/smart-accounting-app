import { CurrencyCode } from './Currency';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationFrequency {
  IMMEDIATE = 'IMMEDIATE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface NotificationSettings {
  channels: {
    [channel in NotificationChannel]: {
      enabled: boolean;
      frequency: NotificationFrequency;
      types: string[];
      schedule?: {
        time?: string;
        days?: string[];
        timezone?: string;
      };
    };
  };
  preferences: {
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
    digest?: {
      enabled: boolean;
      frequency: NotificationFrequency;
      summary: boolean;
    };
  };
}

export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    method: 'sms' | 'email' | 'authenticator';
    backupCodes?: string[];
    lastVerified?: Date;
  };
  sessionTimeout: number; // in minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
    preventReuse: number; // number of previous passwords to prevent reuse
  };
  ipRestrictions?: {
    enabled: boolean;
    allowedIPs: string[];
    whitelistOnly: boolean;
  };
  loginAttempts: {
    maxAttempts: number;
    lockoutDuration: number; // in minutes
    resetAfter: number; // in minutes
  };
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: CurrencyCode;
  dashboard: {
    layout: 'grid' | 'list';
    defaultView: string;
    widgets: string[];
    refreshInterval: number;
  };
  table: {
    defaultPageSize: number;
    defaultSort: {
      field: string;
      direction: 'asc' | 'desc';
    };
    showRowNumbers: boolean;
    enableColumnResize: boolean;
  };
}

export interface IntegrationSettings {
  bankAccounts: {
    enabled: boolean;
    providers: string[];
    autoReconcile: boolean;
    syncFrequency: number;
  };
  paymentGateways: {
    enabled: boolean;
    providers: string[];
    defaultProvider: string;
    supportedCurrencies: CurrencyCode[];
  };
  taxServices: {
    enabled: boolean;
    providers: string[];
    autoCalculate: boolean;
    filingReminders: boolean;
  };
  accountingSoftware: {
    enabled: boolean;
    providers: string[];
    syncFrequency: number;
    dataRetention: number; // in days
  };
  inventory: {
    enabled: boolean;
    providers: string[];
    lowStockThreshold: number;
    reorderPoint: number;
  };
}

export interface BackupSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number; // in days
  includeAttachments: boolean;
  compression: boolean;
  encryption: boolean;
  storage: {
    type: 'local' | 'cloud';
    provider?: string;
    path?: string;
  };
  schedule: {
    time: string;
    days?: string[];
    timezone: string;
  };
}

export interface Settings {
  id: string;
  organizationId: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
  display: DisplaySettings;
  integrations: IntegrationSettings;
  backup: BackupSettings;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsSummary {
  total: number;
  byOrganization: {
    [organizationId: string]: number;
  };
  byTheme: {
    [theme: string]: number;
  };
  byLanguage: {
    [language: string]: number;
  };
  byTimezone: {
    [timezone: string]: number;
  };
  byCurrency: {
    [currency in CurrencyCode]?: number;
  };
  byIntegration: {
    [provider: string]: number;
  };
}

export interface SettingsFilters {
  organizationId?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  currency?: CurrencyCode;
  search?: string;
}

// Validation rules
export const settingsValidationRules = {
  notifications: {
    validate: (settings: NotificationSettings) => {
      // At least one notification channel must be enabled
      return Object.values(settings.channels).some(channel => channel.enabled);
    },
    message: 'At least one notification channel must be enabled'
  },
  security: {
    validate: (settings: SecuritySettings) => {
      if (settings.twoFactorAuth.enabled && !settings.twoFactorAuth.method) {
        return false;
      }
      if (settings.ipRestrictions?.enabled && 
          (!settings.ipRestrictions.allowedIPs || settings.ipRestrictions.allowedIPs.length === 0)) {
        return false;
      }
      return true;
    },
    message: 'Invalid security settings configuration'
  },
  display: {
    validate: (settings: DisplaySettings) => {
      return settings.theme && settings.language && settings.timezone && 
             settings.dateFormat && settings.timeFormat && settings.currency;
    },
    message: 'All display settings fields are required'
  }
}; 