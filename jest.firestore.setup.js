const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { resolve } = require('path');

let testEnv;

beforeAll(async () => {
  // Load Firestore rules
  const rules = readFileSync(resolve(__dirname, 'firestore.rules'), 'utf8');
  
  // Initialize test environment
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: {
      rules,
    },
  });
});

beforeEach(async () => {
  // Clear all data before each test
  await testEnv.clearFirestore();
});

afterAll(async () => {
  // Clean up test environment
  await testEnv.cleanup();
});

// Helper function to get authenticated test context
const getAuthenticatedContext = (uid) => {
  return testEnv.authenticatedContext(uid);
};

// Helper function to get unauthenticated test context
const getUnauthenticatedContext = () => {
  return testEnv.unauthenticatedContext();
};

// Export helper functions
global.getAuthenticatedContext = getAuthenticatedContext;
global.getUnauthenticatedContext = getUnauthenticatedContext; 