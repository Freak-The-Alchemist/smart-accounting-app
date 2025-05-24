export enum APIKeyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum APIKeyPermission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
}

export interface APIKeyScope {
  resources: string[];
  permissions: APIKeyPermission[];
  ipRestrictions?: string[];
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
  expiresAt?: Date;
  allowedOperations?: string[];
  allowedEndpoints?: string[];
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  status: APIKeyStatus;
  organizationId: string;
  userId: string;
  scope: APIKeyScope;
  lastUsedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revokedBy?: string;
  revokedReason?: string;
  usageStats?: {
    totalRequests: number;
    lastRequestAt?: Date;
    requestsByEndpoint?: Record<string, number>;
    requestsByResource?: Record<string, number>;
  };
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIKeySummary {
  total: number;
  byStatus: {
    [status in APIKeyStatus]: number;
  };
  byUser: {
    [userId: string]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  usageStats: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
    totalRequests: number;
    averageRequestsPerKey: number;
  };
}

export interface APIKeyFilters {
  status?: APIKeyStatus;
  userId?: string;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const apiKeyValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  scope: {
    required: true,
    validate: (scope: APIKeyScope) => {
      if (!scope.resources || scope.resources.length === 0) {
        return false;
      }
      if (!scope.permissions || scope.permissions.length === 0) {
        return false;
      }
      return true;
    },
    message: 'Scope must include at least one resource and permission'
  },
  ipRestrictions: {
    validate: (ips: string[]) => {
      if (!ips) return true;
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ips.every(ip => ipRegex.test(ip));
    },
    message: 'IP restrictions must be valid IP addresses'
  }
}; 