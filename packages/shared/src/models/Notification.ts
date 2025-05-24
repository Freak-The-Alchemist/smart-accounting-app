export enum NotificationType {
  SYSTEM = 'SYSTEM',
  ALERT = 'ALERT',
  REMINDER = 'REMINDER',
  APPROVAL = 'APPROVAL',
  REPORT = 'REPORT',
  TRANSACTION = 'TRANSACTION',
  DOCUMENT = 'DOCUMENT',
  TASK = 'TASK',
  COMPLIANCE = 'COMPLIANCE',
  AUDIT = 'AUDIT',
  CUSTOM = 'CUSTOM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  TEAMS = 'TEAMS',
  CUSTOM = 'CUSTOM',
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  content: {
    text: string;
    html?: string;
    template?: string;
    variables?: string[];
  };
  metadata?: Record<string, any>;
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'role' | 'group' | 'external';
  value: string;
  channels: NotificationChannel[];
  preferences?: {
    [channel in NotificationChannel]?: {
      enabled: boolean;
      schedule?: {
        startTime?: string;
        endTime?: string;
        timezone?: string;
        daysOfWeek?: number[];
      };
    };
  };
}

export interface NotificationDelivery {
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  organizationId: string;
  createdBy: string;
  template: NotificationTemplate;
  recipients: NotificationRecipient[];
  content: {
    subject: string;
    body: string;
    data?: Record<string, any>;
    attachments?: {
      id: string;
      name: string;
      type: string;
      url: string;
      size: number;
    }[];
  };
  delivery: {
    [channel in NotificationChannel]?: NotificationDelivery;
  };
  schedule?: {
    sendAt: Date;
    expiresAt?: Date;
    retryCount?: number;
    retryInterval?: number; // in minutes
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSummary {
  total: number;
  byType: {
    [type in NotificationType]: number;
  };
  byPriority: {
    [priority in NotificationPriority]: number;
  };
  byStatus: {
    [status in NotificationStatus]: number;
  };
  byChannel: {
    [channel in NotificationChannel]: {
      total: number;
      delivered: number;
      failed: number;
      averageDeliveryTime: number;
    };
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  performance: {
    averageDeliveryTime: number;
    successRate: number;
    failureRate: number;
    byHour: {
      [hour: number]: number;
    };
    byDay: {
      [day: number]: number;
    };
  };
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  recipientId?: string;
  search?: string;
}

// Validation rules
export const notificationValidationRules = {
  type: {
    required: true,
    enum: Object.values(NotificationType)
  },
  priority: {
    required: true,
    enum: Object.values(NotificationPriority)
  },
  status: {
    required: true,
    enum: Object.values(NotificationStatus)
  },
  template: {
    required: true,
    validate: (template: NotificationTemplate) => {
      return template.name && 
             template.type && 
             template.channels && 
             template.channels.length > 0 && 
             template.content;
    },
    message: 'Invalid notification template configuration'
  },
  recipients: {
    required: true,
    validate: (recipients: NotificationRecipient[]) => {
      return recipients.length > 0 && 
             recipients.every(recipient => 
               recipient.id && 
               recipient.type && 
               recipient.value && 
               recipient.channels && 
               recipient.channels.length > 0
             );
    },
    message: 'Invalid notification recipients configuration'
  },
  content: {
    required: true,
    validate: (content: Notification['content']) => {
      return content.subject && content.body;
    },
    message: 'Invalid notification content configuration'
  }
}; 