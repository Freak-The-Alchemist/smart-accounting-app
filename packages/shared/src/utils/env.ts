const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export const validateEnv = () => {
  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate numeric values
  const numericVars = [
    'VITE_OCR_TIMEOUT',
    'VITE_VOICE_RECOGNITION_TIMEOUT',
    'VITE_EXCEL_MAX_ROWS',
    'VITE_MAX_FILE_SIZE',
    'VITE_MAX_UPLOAD_FILES',
  ] as const;

  const invalidNumericVars = numericVars.filter(
    (envVar) => isNaN(Number(import.meta.env[envVar]))
  );

  if (invalidNumericVars.length > 0) {
    throw new Error(
      `Invalid numeric environment variables: ${invalidNumericVars.join(', ')}`
    );
  }

  // Validate boolean values
  const booleanVars = [
    'VITE_FIREBASE_USE_EMULATOR',
    'VITE_ENABLE_OCR',
    'VITE_ENABLE_VOICE_INPUT',
    'VITE_ENABLE_EXCEL_EXPORT',
    'VITE_APP_DEBUG',
  ] as const;

  const invalidBooleanVars = booleanVars.filter(
    (envVar) =>
      import.meta.env[envVar] !== 'true' && import.meta.env[envVar] !== 'false'
  );

  if (invalidBooleanVars.length > 0) {
    throw new Error(
      `Invalid boolean environment variables: ${invalidBooleanVars.join(', ')}`
    );
  }

  // Validate URLs
  const urlVars = [
    'VITE_API_URL',
    'VITE_FIREBASE_AUTH_EMULATOR_HOST',
    'VITE_FIREBASE_FIRESTORE_EMULATOR_HOST',
    'VITE_FIREBASE_DATABASE_EMULATOR_HOST',
    'VITE_FIREBASE_STORAGE_EMULATOR_HOST',
    'VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST',
  ] as const;

  const invalidUrlVars = urlVars.filter((envVar) => {
    try {
      new URL(import.meta.env[envVar]);
      return false;
    } catch {
      return true;
    }
  });

  if (invalidUrlVars.length > 0) {
    throw new Error(
      `Invalid URL environment variables: ${invalidUrlVars.join(', ')}`
    );
  }
};

export const getEnvVar = <K extends keyof ImportMetaEnv>(key: K): ImportMetaEnv[K] => {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const getEnvVarOrDefault = <K extends keyof ImportMetaEnv>(
  key: K,
  defaultValue: ImportMetaEnv[K]
): ImportMetaEnv[K] => {
  return import.meta.env[key] ?? defaultValue;
};

// Helper functions for specific types
export const getBooleanEnvVar = (key: keyof ImportMetaEnv): boolean => {
  const value = getEnvVar(key);
  return value === 'true';
};

export const getNumberEnvVar = (key: keyof ImportMetaEnv): number => {
  const value = getEnvVar(key);
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return num;
};

export const getUrlEnvVar = (key: keyof ImportMetaEnv): URL => {
  const value = getEnvVar(key);
  try {
    return new URL(value);
  } catch {
    throw new Error(`Environment variable ${key} is not a valid URL`);
  }
}; 