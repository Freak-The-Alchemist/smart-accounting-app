export enum RoleType {
  SYSTEM = 'SYSTEM',
  ORGANIZATION = 'ORGANIZATION',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT = 'PROJECT',
  CUSTOM = 'CUSTOM',
}

export enum RoleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  ORGANIZATION = 'ORGANIZATION',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT = 'PROJECT',
  USER = 'USER',
}

export interface RolePermission {
  resource: string;
  actions: string[];
  conditions?: {
    type: 'all' | 'any' | 'none';
    rules: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
      value: any;
    }[];
  };
  scope: PermissionScope;
  metadata?: Record<string, any>;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'inactive' | 'expired';
  metadata?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  type: RoleType;
  status: RoleStatus;
  organizationId: string;
  createdBy: string;
  permissions: RolePermission[];
  assignments: RoleAssignment[];
  inheritance?: {
    roles: string[];
    mode: 'union' | 'intersection' | 'override';
  };
  restrictions?: {
    maxUsers?: number;
    allowedDepartments?: string[];
    allowedProjects?: string[];
    allowedLocations?: string[];
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      timezone?: string;
    };
    ipRestrictions?: string[];
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleSummary {
  total: number;
  byType: {
    [type in RoleType]: number;
  };
  byStatus: {
    [status in RoleStatus]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  permissions: {
    total: number;
    byResource: {
      [resource: string]: number;
    };
    byScope: {
      [scope in PermissionScope]: number;
    };
  };
  assignments: {
    total: number;
    active: number;
    inactive: number;
    expired: number;
    byUser: {
      [userId: string]: number;
    };
  };
  usage: {
    averagePermissions: number;
    averageAssignments: number;
    mostCommonResources: string[];
    mostCommonActions: string[];
  };
}

export interface RoleFilters {
  type?: RoleType;
  status?: RoleStatus;
  organizationId?: string;
  resource?: string;
  scope?: PermissionScope;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Validation rules
export const roleValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  type: {
    required: true,
    enum: Object.values(RoleType)
  },
  status: {
    required: true,
    enum: Object.values(RoleStatus)
  },
  permissions: {
    required: true,
    validate: (permissions: RolePermission[]) => {
      return permissions.every(permission => 
        permission.resource && 
        permission.actions && 
        permission.actions.length > 0 && 
        permission.scope
      );
    },
    message: 'Invalid role permissions configuration'
  },
  assignments: {
    validate: (assignments: RoleAssignment[]) => {
      return assignments.every(assignment => 
        assignment.id && 
        assignment.userId && 
        assignment.assignedBy && 
        assignment.assignedAt && 
        assignment.status
      );
    },
    message: 'Invalid role assignments configuration'
  }
}; 