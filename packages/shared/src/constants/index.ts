export const APP_NAME = 'Smart Accounting';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const FEATURE_FLAGS = {
  ENABLE_OCR: import.meta.env.VITE_ENABLE_OCR === 'true',
  ENABLE_VOICE_INPUT: import.meta.env.VITE_ENABLE_VOICE_INPUT === 'true',
  ENABLE_EXCEL_EXPORT: import.meta.env.VITE_ENABLE_EXCEL_EXPORT === 'true',
};

export const APP_CONFIG = {
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880,
  MAX_UPLOAD_FILES: Number(import.meta.env.VITE_MAX_UPLOAD_FILES) || 10,
  OCR_LANGUAGE: import.meta.env.VITE_OCR_LANGUAGE || 'eng',
  OCR_TIMEOUT: Number(import.meta.env.VITE_OCR_TIMEOUT) || 30000,
  VOICE_RECOGNITION_TIMEOUT: Number(import.meta.env.VITE_VOICE_RECOGNITION_TIMEOUT) || 10000,
  VOICE_RECOGNITION_LANGUAGE: import.meta.env.VITE_VOICE_RECOGNITION_LANGUAGE || 'en-US',
  EXCEL_MAX_ROWS: Number(import.meta.env.VITE_EXCEL_MAX_ROWS) || 10000,
  EXCEL_DATE_FORMAT: import.meta.env.VITE_EXCEL_DATE_FORMAT || 'YYYY-MM-DD',
}; 