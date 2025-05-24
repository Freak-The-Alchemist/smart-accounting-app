export enum AuditLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  OTHER = 'OTHER',
}

export enum AuditLogStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  WARNING = 'WARNING',
}

export interface AuditLogMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  additionalInfo?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  action: AuditLogAction;
  status: AuditLogStatus;
  userId: string;
  organizationId: string;
  resourceType: string;
  resourceId: string;
  description: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: AuditLogMetadata;
  createdAt: Date;
}

export interface AuditLogSummary {
  total: number;
  byAction: {
    [action in AuditLogAction]: number;
  };
  byStatus: {
    [status in AuditLogStatus]: number;
  };
  byResourceType: {
    [resourceType: string]: number;
  };
  byUser: {
    [userId: string]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
}

export interface AuditLogFilters {
  action?: AuditLogAction;
  status?: AuditLogStatus;
  userId?: string;
  organizationId?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
} 