export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  STATEMENT = 'STATEMENT',
  CONTRACT = 'CONTRACT',
  AGREEMENT = 'AGREEMENT',
  REPORT = 'REPORT',
  CERTIFICATE = 'CERTIFICATE',
  LICENSE = 'LICENSE',
  PERMIT = 'PERMIT',
  POLICY = 'POLICY',
  PROCEDURE = 'PROCEDURE',
  FORM = 'FORM',
  TEMPLATE = 'TEMPLATE',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
  EXPIRED = 'EXPIRED',
}

export enum DocumentCategory {
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  OPERATIONAL = 'OPERATIONAL',
  COMPLIANCE = 'COMPLIANCE',
  HR = 'HR',
  IT = 'IT',
  MARKETING = 'MARKETING',
  SALES = 'SALES',
  CUSTOM = 'CUSTOM',
}

export interface DocumentVersion {
  version: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: DocumentStatus;
  content: {
    url: string;
    format: string;
    size: number;
    hash: string;
  };
  metadata?: Record<string, any>;
}

export interface DocumentReview {
  id: string;
  reviewer: string;
  status: 'approved' | 'rejected' | 'pending';
  comments?: string;
  reviewedAt: Date;
  deadline?: Date;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
}

export interface DocumentAccess {
  roles: string[];
  users: string[];
  permissions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    share: boolean;
    download: boolean;
    print: boolean;
  };
  restrictions?: {
    ipAddresses?: string[];
    timeRestrictions?: {
      startTime: string;
      endTime: string;
      daysOfWeek: number[];
    };
    locationRestrictions?: string[];
  };
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  organizationId: string;
  createdBy: string;
  currentVersion: DocumentVersion;
  versions: DocumentVersion[];
  reviews: DocumentReview[];
  access: DocumentAccess;
  tags?: string[];
  relatedDocuments?: {
    id: string;
    type: DocumentType;
    relationship: 'parent' | 'child' | 'related' | 'reference';
  }[];
  metadata: {
    author: string;
    department?: string;
    project?: string;
    client?: string;
    vendor?: string;
    expiryDate?: Date;
    retentionPeriod?: number; // in days
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSummary {
  total: number;
  byType: {
    [type in DocumentType]: number;
  };
  byStatus: {
    [status in DocumentStatus]: number;
  };
  byCategory: {
    [category in DocumentCategory]: number;
  };
  byOrganization: {
    [organizationId: string]: number;
  };
  storage: {
    totalSize: number;
    byType: {
      [type in DocumentType]: number;
    };
    byFormat: {
      [format: string]: number;
    };
  };
  versions: {
    total: number;
    averagePerDocument: number;
    byStatus: {
      [status in DocumentStatus]: number;
    };
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageResponseTime: number;
  };
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  category?: DocumentCategory;
  organizationId?: string;
  startDate?: Date;
  endDate?: Date;
  author?: string;
  reviewer?: string;
  tags?: string[];
  search?: string;
}

// Validation rules
export const documentValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 200
  },
  type: {
    required: true,
    enum: Object.values(DocumentType)
  },
  category: {
    required: true,
    enum: Object.values(DocumentCategory)
  },
  status: {
    required: true,
    enum: Object.values(DocumentStatus)
  },
  currentVersion: {
    required: true,
    validate: (version: DocumentVersion) => {
      return version.version && 
             version.createdBy && 
             version.createdAt && 
             version.status && 
             version.content;
    },
    message: 'Invalid document version configuration'
  },
  access: {
    required: true,
    validate: (access: DocumentAccess) => {
      return access.roles && 
             access.permissions && 
             Object.values(access.permissions).some(Boolean);
    },
    message: 'Invalid document access configuration'
  }
}; 