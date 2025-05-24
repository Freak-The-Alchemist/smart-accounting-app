export enum ComplianceType {
  REGULATORY = 'REGULATORY',
  INDUSTRY = 'INDUSTRY',
  INTERNAL = 'INTERNAL',
  LEGAL = 'LEGAL',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  HEALTH_SAFETY = 'HEALTH_SAFETY',
  DATA_PRIVACY = 'DATA_PRIVACY',
  CUSTOM = 'CUSTOM',
}

export enum ComplianceStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum CompliancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  type: ComplianceType;
  priority: CompliancePriority;
  category: string;
  effectiveDate: Date;
  expiryDate?: Date;
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  documentation?: {
    required: boolean;
    types: string[];
    retentionPeriod: number; // in days
    notes?: string;
  };
  controls?: {
    id: string;
    name: string;
    description: string;
    type: 'preventive' | 'detective' | 'corrective';
    status: 'implemented' | 'in_progress' | 'planned' | 'not_applicable';
    effectiveness?: 'high' | 'medium' | 'low';
  }[];
  metadata?: Record<string, any>;
}

export interface ComplianceAssessment {
  id: string;
  requirementId: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  assessmentDate: Date;
  assessedBy: string;
  findings: {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    evidence?: {
      type: string;
      description: string;
      url?: string;
      uploadedAt: Date;
    }[];
    remediation?: {
      plan: string;
      dueDate: Date;
      status: 'planned' | 'in_progress' | 'completed';
      completedAt?: Date;
      verifiedBy?: string;
    };
  }[];
  notes?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  metadata?: Record<string, any>;
}

export interface ComplianceDocument {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  requirementId: string;
  content: {
    url: string;
    format: string;
    size: number;
  };
  metadata: {
    author: string;
    createdDate: Date;
    lastModifiedDate: Date;
    lastModifiedBy: string;
    reviewDate?: Date;
    expiryDate?: Date;
    tags?: string[];
  };
  permissions?: {
    roles: string[];
    users: string[];
    restrictions?: string[];
  };
}

export interface Compliance {
  id: string;
  name: string;
  description: string;
  type: ComplianceType;
  status: ComplianceStatus;
  priority: CompliancePriority;
  organizationId: string;
  createdBy: string;
  requirements: ComplianceRequirement[];
  assessments: ComplianceAssessment[];
  documents: ComplianceDocument[];
  schedule: {
    nextAssessment: Date;
    lastAssessment?: Date;
    frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
    reminders?: {
      daysBefore: number;
      recipients: string[];
    }[];
  };
  contacts: {
    primary: string;
    secondary?: string;
    regulatory?: string;
    legal?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceSummary {
  total: number;
  byType: {
    [type in ComplianceType]: number;
  };
  byStatus: {
    [status in ComplianceStatus]: number;
  };
  byPriority: {
    [priority in CompliancePriority]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  assessments: {
    total: number;
    byStatus: {
      [status: string]: number;
    };
    byRequirement: {
      [requirementId: string]: {
        total: number;
        compliant: number;
        nonCompliant: number;
      };
    };
    averageCompliance: number;
  };
  documents: {
    total: number;
    byStatus: {
      [status: string]: number;
    };
    byType: {
      [type: string]: number;
    };
    expiringSoon: number;
  };
}

export interface ComplianceFilters {
  type?: ComplianceType;
  status?: ComplianceStatus;
  priority?: CompliancePriority;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  requirementId?: string;
  search?: string;
}

// Validation rules
export const complianceValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(ComplianceType)
  },
  status: {
    required: true,
    enum: Object.values(ComplianceStatus)
  },
  priority: {
    required: true,
    enum: Object.values(CompliancePriority)
  },
  requirements: {
    required: true,
    validate: (requirements: ComplianceRequirement[]) => {
      return requirements.every(req => 
        req.code && 
        req.title && 
        req.type && 
        req.priority && 
        req.effectiveDate
      );
    },
    message: 'Invalid compliance requirements configuration'
  },
  schedule: {
    required: true,
    validate: (schedule: Compliance['schedule']) => {
      return schedule.nextAssessment && 
             schedule.frequency;
    },
    message: 'Invalid compliance schedule configuration'
  }
}; 