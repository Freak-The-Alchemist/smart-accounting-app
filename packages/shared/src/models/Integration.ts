export enum IntegrationType {
  BANK = 'BANK',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  TAX_SERVICE = 'TAX_SERVICE',
  ACCOUNTING_SOFTWARE = 'ACCOUNTING_SOFTWARE',
  CRM = 'CRM',
  E_COMMERCE = 'E_COMMERCE',
  INVENTORY = 'INVENTORY',
  SHIPPING = 'SHIPPING',
  OTHER = 'OTHER',
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CONFIGURING = 'CONFIGURING',
}

export interface IntegrationCredentials {
  apiKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
  token?: string;
  certificate?: string;
  oauth?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
  additionalData?: Record<string, any>;
}

export interface IntegrationConfig {
  endpoint?: string;
  version?: string;
  environment?: 'production' | 'sandbox' | 'development';
  timeout?: number;
  retryAttempts?: number;
  webhookUrl?: string;
  syncInterval?: number;
  syncSchedule?: string;
  dataMapping?: Record<string, string>;
  additionalConfig?: Record<string, any>;
}

export interface IntegrationSync {
  id: string;
  status: 'success' | 'failed' | 'in_progress';
  startedAt: Date;
  completedAt?: Date;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
  stats?: {
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    duration: number;
  };
}

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  organizationId: string;
  provider: string;
  credentials: IntegrationCredentials;
  config: IntegrationConfig;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  lastError?: {
    message: string;
    code: string;
    timestamp: Date;
    details?: Record<string, any>;
  };
  syncHistory?: IntegrationSync[];
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationSummary {
  total: number;
  byType: {
    [type in IntegrationType]: number;
  };
  byStatus: {
    [status in IntegrationStatus]: number;
  };
  byProvider: {
    [provider: string]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  syncStats: {
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
    averageDuration: number;
  };
}

export interface IntegrationFilters {
  type?: IntegrationType;
  status?: IntegrationStatus;
  provider?: string;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const integrationValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  type: {
    required: true,
    enum: Object.values(IntegrationType)
  },
  provider: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  credentials: {
    required: true,
    validate: (credentials: IntegrationCredentials) => {
      // At least one authentication method must be provided
      return !!(credentials.apiKey || credentials.secretKey || 
                credentials.username || credentials.token || 
                credentials.oauth);
    },
    message: 'At least one authentication method must be provided'
  }
}; 