/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // Emulator Configuration
  readonly VITE_FIREBASE_USE_EMULATOR: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST: string;
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: string;
  readonly VITE_FIREBASE_DATABASE_EMULATOR_HOST: string;
  readonly VITE_FIREBASE_STORAGE_EMULATOR_HOST: string;
  readonly VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST: string;

  // Feature Flags
  readonly VITE_ENABLE_OCR: string;
  readonly VITE_ENABLE_VOICE_INPUT: string;
  readonly VITE_ENABLE_EXCEL_EXPORT: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_CRASH_REPORTING: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;

  // App Configuration
  readonly VITE_APP_ENV: string;
  readonly VITE_APP_DEBUG: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_LOG_LEVEL: string;

  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_VERSION: string;

  // Security Settings
  readonly VITE_ALLOWED_ORIGINS: string;

  // Feature-Specific Settings
  readonly VITE_OCR_LANGUAGE: string;
  readonly VITE_OCR_TIMEOUT: string;
  readonly VITE_OCR_CONFIDENCE_THRESHOLD: string;
  readonly VITE_VOICE_RECOGNITION_TIMEOUT: string;
  readonly VITE_VOICE_RECOGNITION_LANGUAGE: string;
  readonly VITE_VOICE_RECOGNITION_CONTINUOUS: string;
  readonly VITE_EXCEL_MAX_ROWS: string;
  readonly VITE_EXCEL_DATE_FORMAT: string;
  readonly VITE_EXCEL_TIME_FORMAT: string;

  // Performance Settings
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_MAX_UPLOAD_FILES: string;

  // Additional App Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_API_TIMEOUT: string;

  // New variables
  readonly VITE_CORS_ENABLED: string;
  readonly VITE_RATE_LIMIT_REQUESTS: string;
  readonly VITE_RATE_LIMIT_WINDOW_MS: string;
  readonly VITE_CACHE_DURATION: string;
  readonly VITE_EXPO_APP_ID: string;
  readonly VITE_EXPO_VERSION: string;
  readonly VITE_EXPO_BUILD_NUMBER: string;
  readonly VITE_EXPO_UPDATES_ENABLED: string;
  readonly VITE_EXPO_UPDATES_CHECK_ON_LAUNCH: string;
  readonly VITE_EXPO_UPDATES_FALLBACK_TO_CACHE_TIMEOUT: string;
  readonly VITE_AUTO_BACKUP_ENABLED: string;
  readonly VITE_BACKUP_INTERVAL: string;
  readonly VITE_SYNC_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 