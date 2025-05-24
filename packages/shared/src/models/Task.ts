export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  BLOCKED = 'BLOCKED',
  ON_HOLD = 'ON_HOLD',
}

export enum TaskType {
  TRANSACTION = 'TRANSACTION',
  REPORT = 'REPORT',
  BUDGET = 'BUDGET',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  RECONCILIATION = 'RECONCILIATION',
  TAX = 'TAX',
  AUDIT = 'AUDIT',
  COMPLIANCE = 'COMPLIANCE',
  OTHER = 'OTHER',
}

export interface TaskAssignee {
  userId: string;
  assignedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  mentions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskChecklist {
  id: string;
  title: string;
  items: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
    dueDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked_by' | 'relates_to';
  status: 'pending' | 'completed';
}

export interface TaskTimeTracking {
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  notes?: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  organizationId: string;
  createdBy: string;
  assignees: TaskAssignee[];
  dueDate: Date;
  startDate?: Date;
  completedAt?: Date;
  comments: TaskComment[];
  checklist?: TaskChecklist[];
  dependencies?: TaskDependency[];
  timeTracking?: TaskTimeTracking[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  tags?: string[];
  labels?: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100
  parentTaskId?: string;
  subtasks?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSummary {
  total: number;
  byType: {
    [type in TaskType]: number;
  };
  byPriority: {
    [priority in TaskPriority]: number;
  };
  byStatus: {
    [status in TaskStatus]: number;
  };
  byAssignee: {
    [userId: string]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  timeTracking: {
    totalEstimated: number;
    totalActual: number;
    byUser: {
      [userId: string]: {
        estimated: number;
        actual: number;
      };
    };
  };
  completion: {
    onTime: number;
    overdue: number;
    upcoming: number;
    averageCompletionTime: number;
  };
}

export interface TaskFilters {
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  labels?: string[];
  search?: string;
}

// Validation rules
export const taskValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(TaskType)
  },
  priority: {
    required: true,
    enum: Object.values(TaskPriority)
  },
  status: {
    required: true,
    enum: Object.values(TaskStatus)
  },
  dueDate: {
    required: true,
    validate: (date: Date) => date > new Date(),
    message: 'Due date must be in the future'
  },
  assignees: {
    required: true,
    minLength: 1,
    message: 'At least one assignee must be specified'
  }
}; 