export type UserRole = 'admin' | 'accountant' | 'attendant';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  preferences?: {
    language?: 'en' | 'sw';
    currency?: string;
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
  settings?: {
    defaultCurrency?: string;
    defaultLanguage?: 'en' | 'sw';
    defaultDateFormat?: string;
    defaultTimeFormat?: string;
    defaultNumberFormat?: string;
  };
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
} 