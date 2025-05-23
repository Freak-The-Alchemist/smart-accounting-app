/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_USE_EMULATOR: string;
  readonly VITE_EMULATOR_AUTH_HOST: string;
  readonly VITE_EMULATOR_FIRESTORE_HOST: string;
  readonly VITE_EMULATOR_STORAGE_HOST: string;
  readonly VITE_ENABLE_OCR: string;
  readonly VITE_ENABLE_VOICE_INPUT: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_MIN_PASSWORD_LENGTH: string;
  readonly VITE_REQUIRE_SPECIAL_CHARS: string;
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_OCR_PROVIDER: string;
  readonly VITE_OCR_CONFIDENCE_THRESHOLD: string;
  readonly VITE_VOICE_PROVIDER: string;
  readonly VITE_VOICE_LANGUAGE: string;
  readonly VITE_DEFAULT_DATE_FORMAT: string;
  readonly VITE_DEFAULT_CURRENCY: string;
  readonly VITE_CACHE_TIMEOUT: string;
  readonly VITE_MAX_CONCURRENT_REQUESTS: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 