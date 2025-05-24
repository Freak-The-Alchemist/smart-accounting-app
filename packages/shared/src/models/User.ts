export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export enum UserType {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  PARTNER = 'PARTNER',
  CUSTOM = 'CUSTOM',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  VIEWER = 'VIEWER',
  CUSTOM = 'CUSTOM',
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  title?: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar?: {
    url: string;
    thumbnail?: string;
    updatedAt: Date;
  };
  contact: {
    email: string;
    phone?: string;
    mobile?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
  };
  preferences?: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    currency?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
    theme?: string;
    dashboard?: {
      layout?: string;
      widgets?: string[];
    };
  };
  metadata?: Record<string, any>;
}

export interface UserSecurity {
  password?: {
    hash: string;
    salt: string;
    lastChanged: Date;
    resetToken?: string;
    resetExpires?: Date;
  };
  twoFactor?: {
    enabled: boolean;
    method?: 'authenticator' | 'sms' | 'email';
    secret?: string;
    backupCodes?: string[];
    lastVerified?: Date;
  };
  sessions: {
    id: string;
    device: string;
    ip: string;
    location?: string;
    lastActive: Date;
    expiresAt: Date;
  }[];
  loginHistory: {
    timestamp: Date;
    ip: string;
    device: string;
    location?: string;
    status: 'success' | 'failed';
    failureReason?: string;
  }[];
  permissions: {
    roles: string[];
    customPermissions?: string[];
    restrictions?: {
      ipAddresses?: string[];
      timeRestrictions?: {
        startTime?: string;
        endTime?: string;
        daysOfWeek?: number[];
      };
      locationRestrictions?: string[];
    };
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: UserStatus;
  type: UserType;
  role: UserRole;
  organizationId: string;
  profile: UserProfile;
  security: UserSecurity;
  settings?: {
    notifications?: {
      channels: string[];
      frequency: string;
      preferences: Record<string, boolean>;
    };
    privacy?: {
      profileVisibility: 'public' | 'private' | 'organization';
      activityVisibility: 'public' | 'private' | 'organization';
      dataSharing: Record<string, boolean>;
    };
    integrations?: {
      [key: string]: {
        enabled: boolean;
        config: Record<string, any>;
      };
    };
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
}

export interface UserSummary {
  total: number;
  byStatus: {
    [status in UserStatus]: number;
  };
  byType: {
    [type in UserType]: number;
  };
  byRole: {
    [role in UserRole]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  security: {
    twoFactorEnabled: number;
    activeSessions: number;
    failedLogins: number;
    passwordExpired: number;
  };
  activity: {
    activeUsers: number;
    inactiveUsers: number;
    averageSessionDuration: number;
    lastLoginDistribution: {
      [period: string]: number;
    };
  };
  preferences: {
    byLanguage: {
      [language: string]: number;
    };
    byTimezone: {
      [timezone: string]: number;
    };
    byTheme: {
      [theme: string]: number;
    };
  };
}

export interface UserFilters {
  status?: UserStatus;
  type?: UserType;
  role?: UserRole;
  organizationId?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface UserSettings {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export type UserWithRole = User & { role: UserRole };

// Validation rules
export const userValidationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  },
  status: {
    required: true,
    enum: Object.values(UserStatus)
  },
  type: {
    required: true,
    enum: Object.values(UserType)
  },
  role: {
    required: true,
    enum: Object.values(UserRole)
  },
  profile: {
    required: true,
    validate: (profile: UserProfile) => {
      return profile.firstName && 
             profile.lastName && 
             profile.contact && 
             profile.contact.email;
    },
    message: 'Invalid user profile configuration'
  },
  security: {
    required: true,
    validate: (security: UserSecurity) => {
      return security.permissions && 
             security.permissions.roles && 
             security.permissions.roles.length > 0;
    },
    message: 'Invalid user security configuration'
  }
}; 