import { RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;
  let adminContext: RulesTestContext;
  let userContext: RulesTestContext;
  let unauthenticatedContext: RulesTestContext;

  beforeAll(async () => {
    // Load Firestore rules
    const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');
    
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-project',
      firestore: { rules },
    });

    // Create test contexts
    adminContext = testEnv.authenticatedContext('admin');
    userContext = testEnv.authenticatedContext('user123');
    unauthenticatedContext = testEnv.unauthenticatedContext();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Journal Entries Collection', () => {
    const journalEntry = {
      type: 'debit',
      amount: 1000,
      description: 'Test entry',
      date: new Date(),
      category: 'expenses',
      currency: 'KES',
      organizationId: 'org123',
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should allow authenticated users to create journal entries', async () => {
      const db = userContext.firestore();
      const doc = db.collection('journalEntries').doc('test-entry');
      
      await expect(doc.set(journalEntry)).resolves.not.toThrow();
    });

    it('should not allow unauthenticated users to create journal entries', async () => {
      const db = unauthenticatedContext.firestore();
      const doc = db.collection('journalEntries').doc('test-entry');
      
      await expect(doc.set(journalEntry)).rejects.toThrow();
    });

    it('should allow users to read their own journal entries', async () => {
      const db = userContext.firestore();
      const doc = db.collection('journalEntries').doc('test-entry');
      
      await doc.set(journalEntry);
      await expect(doc.get()).resolves.not.toThrow();
    });

    it('should not allow users to read other users journal entries', async () => {
      const db = userContext.firestore();
      const doc = db.collection('journalEntries').doc('other-user-entry');
      
      await doc.set({
        ...journalEntry,
        createdBy: 'other-user',
      });
      
      await expect(doc.get()).rejects.toThrow();
    });
  });

  describe('Tax Transactions Collection', () => {
    const taxTransaction = {
      type: 'vat',
      amount: 1000,
      taxAmount: 160,
      date: new Date(),
      dueDate: new Date(),
      status: 'pending',
      organizationId: 'org123',
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should allow authenticated users to create tax transactions', async () => {
      const db = userContext.firestore();
      const doc = db.collection('taxTransactions').doc('test-tax');
      
      await expect(doc.set(taxTransaction)).resolves.not.toThrow();
    });

    it('should not allow unauthenticated users to create tax transactions', async () => {
      const db = unauthenticatedContext.firestore();
      const doc = db.collection('taxTransactions').doc('test-tax');
      
      await expect(doc.set(taxTransaction)).rejects.toThrow();
    });

    it('should allow users to read their own tax transactions', async () => {
      const db = userContext.firestore();
      const doc = db.collection('taxTransactions').doc('test-tax');
      
      await doc.set(taxTransaction);
      await expect(doc.get()).resolves.not.toThrow();
    });
  });

  describe('Bank Reconciliations Collection', () => {
    const bankReconciliation = {
      statementDate: new Date(),
      account: {
        id: 'acc123',
        name: 'Test Account',
      },
      openingBalance: 10000,
      closingBalance: 12000,
      status: 'pending',
      currency: 'KES',
      organizationId: 'org123',
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
      reconciliationSummary: {
        totalCredits: 5000,
        totalDebits: 3000,
        outstandingDeposits: 0,
        outstandingChecks: 0,
      },
    };

    it('should allow authenticated users to create bank reconciliations', async () => {
      const db = userContext.firestore();
      const doc = db.collection('bankReconciliations').doc('test-reconciliation');
      
      await expect(doc.set(bankReconciliation)).resolves.not.toThrow();
    });

    it('should not allow unauthenticated users to create bank reconciliations', async () => {
      const db = unauthenticatedContext.firestore();
      const doc = db.collection('bankReconciliations').doc('test-reconciliation');
      
      await expect(doc.set(bankReconciliation)).rejects.toThrow();
    });

    it('should allow users to read their own bank reconciliations', async () => {
      const db = userContext.firestore();
      const doc = db.collection('bankReconciliations').doc('test-reconciliation');
      
      await doc.set(bankReconciliation);
      await expect(doc.get()).resolves.not.toThrow();
    });
  });

  describe('Organization Access', () => {
    it('should allow organization members to access organization data', async () => {
      const db = userContext.firestore();
      const doc = db.collection('organizations').doc('org123');
      
      await expect(doc.get()).resolves.not.toThrow();
    });

    it('should not allow non-members to access organization data', async () => {
      const db = userContext.firestore();
      const doc = db.collection('organizations').doc('other-org');
      
      await expect(doc.get()).rejects.toThrow();
    });
  });
}); 