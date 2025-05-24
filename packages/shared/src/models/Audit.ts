export enum AuditType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
  COMPLIANCE = 'COMPLIANCE',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  IT = 'IT',
  SECURITY = 'SECURITY',
  CUSTOM = 'CUSTOM',
}

export enum AuditStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum AuditPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditFindingSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditScope {
  id: string;
  name: string;
  description: string;
  areas: string[];
  exclusions?: string[];
  startDate: Date;
  endDate: Date;
  resources?: {
    type: string;
    id: string;
    name: string;
  }[];
  metadata?: Record<string, any>;
}

export interface AuditTeam {
  id: string;
  role: 'lead' | 'member' | 'reviewer' | 'approver';
  userId: string;
  name: string;
  email: string;
  responsibilities: string[];
  assignedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: AuditFindingSeverity;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  evidence?: {
    type: string;
    description: string;
    url?: string;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  recommendations: {
    description: string;
    priority: AuditPriority;
    assignedTo?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  impact?: {
    financial?: number;
    operational?: string;
    compliance?: string;
    security?: string;
  };
  rootCause?: string;
  remediation?: {
    plan: string;
    status: 'planned' | 'in_progress' | 'completed';
    completedAt?: Date;
    verifiedBy?: string;
  };
  metadata?: Record<string, any>;
}

export interface AuditChecklist {
  id: string;
  name: string;
  description: string;
  items: {
    id: string;
    question: string;
    requirement: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable';
    notes?: string;
    evidence?: {
      type: string;
      description: string;
      url?: string;
      uploadedAt: Date;
    }[];
    completedAt?: Date;
    completedBy?: string;
  }[];
  metadata?: Record<string, any>;
}

export interface Audit {
  id: string;
  name: string;
  description: string;
  type: AuditType;
  status: AuditStatus;
  priority: AuditPriority;
  organizationId: string;
  createdBy: string;
  scope: AuditScope;
  team: AuditTeam[];
  findings: AuditFinding[];
  checklist?: AuditChecklist[];
  schedule: {
    startDate: Date;
    endDate: Date;
    milestones?: {
      name: string;
      date: Date;
      status: 'pending' | 'completed' | 'delayed';
    }[];
  };
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  reports?: {
    id: string;
    type: string;
    name: string;
    url: string;
    generatedAt: Date;
    generatedBy: string;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditSummary {
  total: number;
  byType: {
    [type in AuditType]: number;
  };
  byStatus: {
    [status in AuditStatus]: number;
  };
  byPriority: {
    [priority in AuditPriority]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  findings: {
    total: number;
    bySeverity: {
      [severity in AuditFindingSeverity]: number;
    };
    byStatus: {
      [status: string]: number;
    };
    averageResolutionTime: number;
  };
  performance: {
    onTimeCompletion: number;
    averageDuration: number;
    teamEfficiency: {
      [userId: string]: {
        completed: number;
        averageTime: number;
      };
    };
  };
}

export interface AuditFilters {
  type?: AuditType;
  status?: AuditStatus;
  priority?: AuditPriority;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  teamMemberId?: string;
  search?: string;
}

// Validation rules
export const auditValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(AuditType)
  },
  status: {
    required: true,
    enum: Object.values(AuditStatus)
  },
  priority: {
    required: true,
    enum: Object.values(AuditPriority)
  },
  scope: {
    required: true,
    validate: (scope: AuditScope) => {
      return scope.name && 
             scope.areas && 
             scope.areas.length > 0 && 
             scope.startDate && 
             scope.endDate;
    },
    message: 'Invalid audit scope configuration'
  },
  team: {
    required: true,
    validate: (team: AuditTeam[]) => {
      return team.length > 0 && 
             team.some(member => member.role === 'lead');
    },
    message: 'Audit team must have at least one member and a lead'
  }
}; 