export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export interface SubscriptionFeature {
  name: string;
  limit: number;
  used: number;
  remaining: number;
}

export interface SubscriptionPrice {
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: SubscriptionPrice;
  features: SubscriptionFeature[];
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  paymentMethod?: {
    type: string;
    last4?: string;
    expiryDate?: string;
  };
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionSummary {
  total: number;
  byPlan: {
    [plan in SubscriptionPlan]: number;
  };
  byStatus: {
    [status in SubscriptionStatus]: number;
  };
  byBillingCycle: {
    [cycle in BillingCycle]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  revenue: {
    total: number;
    byPlan: {
      [plan in SubscriptionPlan]: number;
    };
    byBillingCycle: {
      [cycle in BillingCycle]: number;
    };
  };
}

export interface SubscriptionFilters {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
} 