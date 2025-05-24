const { jestFirestoreConfig } = require('jest-firestore');

module.exports = {
  ...jestFirestoreConfig,
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.firestore.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.firestore.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.firestore.test.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}; 