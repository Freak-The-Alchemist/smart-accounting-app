import { Timestamp } from 'firebase/firestore';

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'other';

export type AuditEntity = 
  | 'account'
  | 'journal_entry'
  | 'tax_transaction'
  | 'tax_report'
  | 'bank_reconciliation'
  | 'user'
  | 'organization'
  | 'other';

export interface AuditTrail {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: string;
  userEmail: string;
  organizationId: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: {
    reason?: string;
    notes?: string;
    location?: string;
    device?: string;
  };
}

// Validation rules
export const auditTrailValidationRules = {
  action: {
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'view',
      'export',
      'approve',
      'reject',
      'login',
      'logout',
      'other'
    ]
  },
  entity: {
    required: true,
    enum: [
      'account',
      'journal_entry',
      'tax_transaction',
      'tax_report',
      'bank_reconciliation',
      'user',
      'organization',
      'other'
    ]
  },
  entityId: {
    required: true
  },
  userId: {
    required: true
  },
  userEmail: {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address'
  },
  organizationId: {
    required: true
  },
  timestamp: {
    required: true
  }
}; 