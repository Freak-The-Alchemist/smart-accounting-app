export enum WebhookEvent {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  TRANSACTION_DELETED = 'TRANSACTION_DELETED',
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_DELETED = 'INVOICE_DELETED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REPORT_GENERATED = 'REPORT_GENERATED',
  BUDGET_UPDATED = 'BUDGET_UPDATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  BANK_RECONCILIATION_CREATED = 'BANK_RECONCILIATION_CREATED',
  BANK_RECONCILIATION_UPDATED = 'BANK_RECONCILIATION_UPDATED',
  BANK_RECONCILIATION_COMPLETED = 'BANK_RECONCILIATION_COMPLETED',
  OTHER = 'OTHER',
}

export enum WebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
}

export interface WebhookDelivery {
  id: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  response: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  };
  attempts: number;
  lastAttemptAt: Date;
  nextAttemptAt?: Date;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
  createdAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  organizationId: string;
  secret: string;
  headers?: Record<string, string>;
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  deliveries: WebhookDelivery[];
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookSummary {
  total: number;
  byEvent: {
    [event in WebhookEvent]: number;
  };
  byStatus: {
    [status in WebhookStatus]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  deliveryStats: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageLatency: number;
  };
}

export interface WebhookFilters {
  event?: WebhookEvent;
  status?: WebhookStatus;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const webhookValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  url: {
    required: true,
    pattern: /^https?:\/\/.+/,
    message: 'URL must be a valid HTTP(S) URL'
  },
  events: {
    required: true,
    minLength: 1,
    message: 'At least one event must be selected'
  },
  secret: {
    required: true,
    minLength: 32,
    message: 'Secret must be at least 32 characters long'
  }
}; 