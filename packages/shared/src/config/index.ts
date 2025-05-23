import { validateEnv, getBooleanEnvVar, getNumberEnvVar, getUrlEnvVar } from '../utils/env';

// Validate environment variables on startup
validateEnv();

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulator?: boolean;
}

export interface EmulatorConfig {
  authHost: string;
  firestoreHost: string;
  storageHost: string;
}

export interface FeatureFlags {
  enableOcr: boolean;
  enableVoiceInput: boolean;
  enableOfflineMode: boolean;
}

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export interface SecurityConfig {
  minPasswordLength: number;
  requireSpecialChars: boolean;
  sessionTimeout: number;
}

export interface OcrConfig {
  provider: 'google' | 'tesseract';
  confidenceThreshold: number;
}

export interface VoiceConfig {
  provider: 'google' | 'azure';
  language: string;
}

export interface ExcelConfig {
  defaultDateFormat: string;
  defaultCurrency: string;
}

export interface PerformanceConfig {
  cacheTimeout: number;
  maxConcurrentRequests: number;
}

interface MobileConfig {
  expoAppId: string;
  expoVersion: string;
  expoBuildNumber: number;
  updatesEnabled: boolean;
  updatesCheckOnLaunch: 'ALWAYS' | 'NEVER' | 'WIFI_ONLY';
  updatesFallbackToCacheTimeout: number;
}

interface BackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number;
  syncInterval: number;
}

export interface AppConfiguration {
  firebase: FirebaseConfig;
  emulator: EmulatorConfig;
  features: FeatureFlags;
  app: AppConfig;
  api: ApiConfig;
  security: SecurityConfig;
  ocr: OcrConfig;
  voice: VoiceConfig;
  excel: ExcelConfig;
  performance: PerformanceConfig;
  mobile: MobileConfig;
  backup: BackupConfig;
}

export const config: AppConfiguration = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    useEmulator: import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true',
  },
  emulator: {
    authHost: import.meta.env.VITE_EMULATOR_AUTH_HOST || 'localhost:9099',
    firestoreHost: import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || 'localhost:8080',
    storageHost: import.meta.env.VITE_EMULATOR_STORAGE_HOST || 'localhost:9199',
  },
  features: {
    enableOcr: import.meta.env.VITE_ENABLE_OCR === 'true',
    enableVoiceInput: import.meta.env.VITE_ENABLE_VOICE_INPUT === 'true',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  },
  app: {
    name: 'Smart Accounting App',
    version: '1.0.0',
    environment: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '5000'),
  },
  security: {
    minPasswordLength: parseInt(import.meta.env.VITE_MIN_PASSWORD_LENGTH || '8'),
    requireSpecialChars: import.meta.env.VITE_REQUIRE_SPECIAL_CHARS === 'true',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600'),
  },
  ocr: {
    provider: (import.meta.env.VITE_OCR_PROVIDER || 'google') as 'google' | 'tesseract',
    confidenceThreshold: parseFloat(import.meta.env.VITE_OCR_CONFIDENCE_THRESHOLD || '0.8'),
  },
  voice: {
    provider: (import.meta.env.VITE_VOICE_PROVIDER || 'google') as 'google' | 'azure',
    language: import.meta.env.VITE_VOICE_LANGUAGE || 'en-US',
  },
  excel: {
    defaultDateFormat: import.meta.env.VITE_DEFAULT_DATE_FORMAT || 'YYYY-MM-DD',
    defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY || 'KES',
  },
  performance: {
    cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'),
    maxConcurrentRequests: parseInt(import.meta.env.VITE_MAX_CONCURRENT_REQUESTS || '5'),
  },
  mobile: {
    expoAppId: import.meta.env.VITE_EXPO_APP_ID || 'com.smartaccounting.app',
    expoVersion: import.meta.env.VITE_EXPO_VERSION || '1.0.0',
    expoBuildNumber: parseInt(import.meta.env.VITE_EXPO_BUILD_NUMBER || '1'),
    updatesEnabled: import.meta.env.VITE_EXPO_UPDATES_ENABLED === 'true',
    updatesCheckOnLaunch: (import.meta.env.VITE_EXPO_UPDATES_CHECK_ON_LAUNCH || 'ALWAYS') as 'ALWAYS' | 'NEVER' | 'WIFI_ONLY',
    updatesFallbackToCacheTimeout: parseInt(import.meta.env.VITE_EXPO_UPDATES_FALLBACK_TO_CACHE_TIMEOUT || '0'),
  },
  backup: {
    autoBackupEnabled: import.meta.env.VITE_AUTO_BACKUP_ENABLED === 'true',
    backupInterval: parseInt(import.meta.env.VITE_BACKUP_INTERVAL || '86400000'),
    syncInterval: parseInt(import.meta.env.VITE_SYNC_INTERVAL || '300000'),
  },
}; 