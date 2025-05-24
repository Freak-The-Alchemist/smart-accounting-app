export enum WorkflowType {
  APPROVAL = 'APPROVAL',
  REVIEW = 'REVIEW',
  ONBOARDING = 'ONBOARDING',
  OFFBOARDING = 'OFFBOARDING',
  PURCHASE = 'PURCHASE',
  EXPENSE = 'EXPENSE',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT = 'AUDIT',
  CUSTOM = 'CUSTOM',
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum WorkflowStepType {
  TASK = 'TASK',
  APPROVAL = 'APPROVAL',
  REVIEW = 'REVIEW',
  NOTIFICATION = 'NOTIFICATION',
  CONDITION = 'CONDITION',
  INTEGRATION = 'INTEGRATION',
  CUSTOM = 'CUSTOM',
}

export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  order: number;
  assignee?: {
    type: 'user' | 'role' | 'group' | 'dynamic';
    value: string;
    fallback?: string;
  };
  action: {
    type: string;
    config: Record<string, any>;
    timeout?: number; // in minutes
    retryCount?: number;
    retryInterval?: number; // in minutes
  };
  conditions?: {
    type: 'all' | 'any' | 'none';
    rules: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
      value: any;
    }[];
  };
  notifications?: {
    type: string;
    template: string;
    recipients: string[];
    channels: string[];
  }[];
  metadata?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  currentStep?: string;
  data: Record<string, any>;
  steps: {
    [stepId: string]: {
      status: WorkflowStepStatus;
      startedAt?: Date;
      completedAt?: Date;
      assignedTo?: string;
      comments?: string;
      attachments?: {
        id: string;
        name: string;
        type: string;
        url: string;
        uploadedAt: Date;
      }[];
      metadata?: Record<string, any>;
    };
  };
  history: {
    stepId: string;
    action: string;
    status: WorkflowStepStatus;
    performedBy: string;
    performedAt: Date;
    comments?: string;
    metadata?: Record<string, any>;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: WorkflowType;
  status: WorkflowStatus;
  organizationId: string;
  createdBy: string;
  version: string;
  steps: WorkflowStep[];
  triggers: {
    type: 'manual' | 'automatic' | 'scheduled' | 'webhook';
    config: Record<string, any>;
  }[];
  notifications: {
    type: string;
    template: string;
    recipients: string[];
    channels: string[];
    conditions?: {
      type: 'all' | 'any' | 'none';
      rules: {
        field: string;
        operator: string;
        value: any;
      }[];
    };
  }[];
  settings: {
    timeout?: number; // in minutes
    retryCount?: number;
    retryInterval?: number; // in minutes
    allowParallel?: boolean;
    allowSkipping?: boolean;
    requireComments?: boolean;
    requireAttachments?: boolean;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowSummary {
  total: number;
  byType: {
    [type in WorkflowType]: number;
  };
  byStatus: {
    [status in WorkflowStatus]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  instances: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    averageCompletionTime: number;
    byStep: {
      [stepId: string]: {
        total: number;
        completed: number;
        rejected: number;
        averageTime: number;
      };
    };
  };
  performance: {
    averageSteps: number;
    completionRate: number;
    rejectionRate: number;
    averageTime: number;
    byHour: {
      [hour: number]: number;
    };
    byDay: {
      [day: number]: number;
    };
  };
}

export interface WorkflowFilters {
  type?: WorkflowType;
  status?: WorkflowStatus;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  search?: string;
}

// Validation rules
export const workflowValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(WorkflowType)
  },
  status: {
    required: true,
    enum: Object.values(WorkflowStatus)
  },
  steps: {
    required: true,
    validate: (steps: WorkflowStep[]) => {
      return steps.length > 0 && 
             steps.every(step => 
               step.id && 
               step.name && 
               step.type && 
               step.status && 
               step.order >= 0 && 
               step.action
             );
    },
    message: 'Invalid workflow steps configuration'
  },
  triggers: {
    required: true,
    validate: (triggers: Workflow['triggers']) => {
      return triggers.length > 0 && 
             triggers.every(trigger => 
               trigger.type && 
               trigger.config
             );
    },
    message: 'Invalid workflow triggers configuration'
  }
}; 