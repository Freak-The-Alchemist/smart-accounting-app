import { User } from 'firebase/auth';

export interface AppUser extends User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  category: string;
  type: 'income' | 'expense';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type: 'income' | 'expense' | 'summary';
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  userId: string;
  notifications: boolean;
  darkMode: boolean;
  offlineMode: boolean;
  biometricAuth: boolean;
  language: string;
  currency: string;
}

export interface SharedProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'in_review' | 'approved' | 'completed';
  ownerId: string;
  ownerName: string;
  lastModified: Date;
  sharedWith: Array<{
    userId: string;
    email: string;
    role: 'viewer' | 'editor' | 'reviewer';
  }>;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
}

export interface ProjectSharingState {
  loading: boolean;
  error: string | null;
  projects: SharedProject[];
}

export interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  type: 'calculator' | 'integration' | 'report' | 'custom';
  config: Record<string, any>;
  isEnabled: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginInstance {
  id: string;
  pluginId: string;
  contextId: string;
  contextType: 'project' | 'organization';
  config: Record<string, any>;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceReport {
  id: string;
  type: 'audit' | 'compliance' | 'tax';
  contextId: string;
  contextType: 'project' | 'organization';
  generatedBy: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  status: 'draft' | 'final' | 'archived';
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  contextId: string;
  contextType: 'project' | 'organization';
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export * from './petrolStation';
export * from './auth';