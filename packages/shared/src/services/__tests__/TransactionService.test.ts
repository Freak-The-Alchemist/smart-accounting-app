import { TransactionService } from '../TransactionService';
import { Transaction, TransactionType, TransactionStatus, TransactionCategory } from '../../models/Transaction';
import { SUPPORTED_CURRENCIES } from '../../models/Currency';
import { ValidationError } from '../../utils/errors';
import * as firestoreFns from 'firebase/firestore';

// Mock firebase/firestore module
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn()
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockCollection: any;
  let mockDoc: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize service
    transactionService = TransactionService.getInstance();

    // Setup mock collection and doc
    mockCollection = {
      doc: jest.fn(),
    };
    
    mockDoc = {
      id: 'mock-id',
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Setup default mock implementations
    (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
    (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
    mockCollection.doc.mockReturnValue(mockDoc);
  });

  describe('createTransaction', () => {
    const transactionParams = {
      organizationId: 'org123',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      reference: 'REF123',
      date: new Date(),
      description: 'Test transaction',
      amount: 1000,
      currency: SUPPORTED_CURRENCIES[0],
      category: TransactionCategory.SALARY,
      lines: [{
        id: 'line1',
        accountId: 'acc123',
        description: 'Test line',
        amount: 1000,
        currency: SUPPORTED_CURRENCIES[0],
        type: 'CREDIT' as const,
        category: TransactionCategory.SALARY
      }],
      createdBy: 'user123',
      updatedBy: 'user123',
      metadata: {},
      attachments: [],
      approvals: [],
      relatedTransactions: []
    };

    it('should create transaction successfully', async () => {
      const mockTransaction: Transaction = {
        id: 'trans123',
        ...transactionParams,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await transactionService.createTransaction(transactionParams);

      expect(result).toEqual(expect.objectContaining({
        ...transactionParams,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }));
      expect(firestoreFns.setDoc).toHaveBeenCalledWith(mockDoc, expect.objectContaining(transactionParams));
    });

    it('should throw ValidationError for invalid transaction parameters', async () => {
      const invalidParams = {
        ...transactionParams,
        amount: -1000, // Invalid negative amount
      };

      await expect(transactionService.createTransaction(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle database errors', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.setDoc as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(transactionService.createTransaction(transactionParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTransaction', () => {
    const transactionId = 'trans123';

    it('should return transaction by id', async () => {
      const mockTransaction: Transaction = {
        id: transactionId,
        organizationId: 'org123',
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        reference: 'REF123',
        date: new Date(),
        description: 'Test transaction',
        amount: 1000,
        currency: SUPPORTED_CURRENCIES[0],
        category: TransactionCategory.SALARY,
        lines: [{
          id: 'line1',
          accountId: 'acc123',
          description: 'Test line',
          amount: 1000,
          currency: SUPPORTED_CURRENCIES[0],
          type: 'CREDIT' as const,
          category: TransactionCategory.SALARY
        }],
        createdBy: 'user123',
        updatedBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
        approvals: [],
        relatedTransactions: []
      };

      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction
      });

      const result = await transactionService.getTransaction(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(firestoreFns.getDoc).toHaveBeenCalledWith(mockDoc);
    });

    it('should return null for non-existent transaction', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      const result = await transactionService.getTransaction(transactionId);

      expect(result).toBeNull();
    });
  });

  describe('listTransactions', () => {
    const filters = {
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      category: TransactionCategory.SALARY,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    };

    it('should return filtered transactions', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: 'trans1',
          organizationId: 'org123',
          type: TransactionType.INCOME,
          status: TransactionStatus.COMPLETED,
          reference: 'REF123',
          date: new Date(),
          description: 'Transaction 1',
          amount: 1000,
          currency: SUPPORTED_CURRENCIES[0],
          category: TransactionCategory.SALARY,
          lines: [{
            id: 'line1',
            accountId: 'acc123',
            description: 'Test line',
            amount: 1000,
            currency: SUPPORTED_CURRENCIES[0],
            type: 'CREDIT' as const,
            category: TransactionCategory.SALARY
          }],
          createdBy: 'user123',
          updatedBy: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          attachments: [],
          approvals: [],
          relatedTransactions: []
        }
      ];

      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.query as jest.Mock).mockReturnValue('mock-query');
      (firestoreFns.where as jest.Mock).mockReturnThis();
      (firestoreFns.orderBy as jest.Mock).mockReturnThis();
      (firestoreFns.getDocs as jest.Mock).mockResolvedValue({
        docs: mockTransactions.map(t => ({
          data: () => t
        }))
      });

      const result = await transactionService.listTransactions(filters);

      expect(result).toEqual(mockTransactions);
      expect(firestoreFns.where).toHaveBeenCalledWith('type', '==', filters.type);
      expect(firestoreFns.where).toHaveBeenCalledWith('status', '==', filters.status);
    });

    it('should return empty array when no transactions match filters', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.query as jest.Mock).mockReturnValue('mock-query');
      (firestoreFns.where as jest.Mock).mockReturnThis();
      (firestoreFns.orderBy as jest.Mock).mockReturnThis();
      (firestoreFns.getDocs as jest.Mock).mockResolvedValue({
        docs: []
      });

      const result = await transactionService.listTransactions(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateTransaction', () => {
    const transactionId = 'trans123';
    const updateParams = {
      description: 'Updated description',
      category: TransactionCategory.SALARY
    };

    it('should update transaction successfully', async () => {
      const mockTransaction: Transaction = {
        id: transactionId,
        organizationId: 'org123',
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        reference: 'REF123',
        date: new Date(),
        description: 'Test transaction',
        amount: 1000,
        currency: SUPPORTED_CURRENCIES[0],
        category: TransactionCategory.SALARY,
        lines: [{
          id: 'line1',
          accountId: 'acc123',
          description: 'Test line',
          amount: 1000,
          currency: SUPPORTED_CURRENCIES[0],
          type: 'CREDIT' as const,
          category: TransactionCategory.SALARY
        }],
        createdBy: 'user123',
        updatedBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
        approvals: [],
        relatedTransactions: []
      };

      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction
      });
      (firestoreFns.updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await transactionService.updateTransaction(transactionId, updateParams);

      expect(result).toEqual(expect.objectContaining({
        ...mockTransaction,
        ...updateParams,
        updatedAt: expect.any(Date)
      }));
      expect(firestoreFns.updateDoc).toHaveBeenCalledWith(mockDoc, expect.objectContaining(updateParams));
    });

    it('should throw error when transaction not found', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      await expect(transactionService.updateTransaction(transactionId, updateParams))
        .rejects
        .toThrow('Transaction not found');
    });

    it('should handle database errors', async () => {
      const mockTransaction: Transaction = {
        id: transactionId,
        organizationId: 'org123',
        type: TransactionType.INCOME,
        status: TransactionStatus.COMPLETED,
        reference: 'REF123',
        date: new Date(),
        description: 'Test transaction',
        amount: 1000,
        currency: SUPPORTED_CURRENCIES[0],
        category: TransactionCategory.SALARY,
        lines: [{
          id: 'line1',
          accountId: 'acc123',
          description: 'Test line',
          amount: 1000,
          currency: SUPPORTED_CURRENCIES[0],
          type: 'CREDIT' as const,
          category: TransactionCategory.SALARY
        }],
        createdBy: 'user123',
        updatedBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
        approvals: [],
        relatedTransactions: []
      };

      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockTransaction
      });
      (firestoreFns.updateDoc as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(transactionService.updateTransaction(transactionId, updateParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('deleteTransaction', () => {
    const transactionId = 'trans123';

    it('should delete transaction successfully', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await transactionService.deleteTransaction(transactionId);

      expect(firestoreFns.deleteDoc).toHaveBeenCalledWith(mockDoc);
    });

    it('should handle database errors', async () => {
      (firestoreFns.collection as jest.Mock).mockReturnValue(mockCollection);
      (firestoreFns.doc as jest.Mock).mockReturnValue(mockDoc);
      (firestoreFns.deleteDoc as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(transactionService.deleteTransaction(transactionId))
        .rejects
        .toThrow('Database error');
    });
  });
}); 