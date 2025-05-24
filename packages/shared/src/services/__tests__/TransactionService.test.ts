import { TransactionService } from '../TransactionService';
import { Transaction, TransactionType, TransactionStatus } from '../../models/Transaction';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { AccountRepository } from '../../repositories/AccountRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/TransactionRepository');
jest.mock('../../repositories/AccountRepository');
jest.mock('../NotificationService');

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockAccountRepository: jest.Mocked<AccountRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockAccountRepository = new AccountRepository() as jest.Mocked<AccountRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    transactionService = new TransactionService(
      mockTransactionRepository,
      mockAccountRepository,
      mockNotificationService
    );
  });

  describe('createTransaction', () => {
    const transactionParams = {
      type: TransactionType.INCOME,
      amount: 1000,
      description: 'Test transaction',
      accountId: 'acc123',
      category: 'Salary',
      date: new Date(),
      metadata: {
        reference: 'REF123',
        notes: 'Test notes',
      },
    };

    it('should create transaction successfully', async () => {
      const mockTransaction = {
        id: 'trans123',
        ...transactionParams,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAccount = {
        id: 'acc123',
        balance: 5000,
      };

      mockTransactionRepository.create.mockResolvedValue(mockTransaction);
      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockAccountRepository.update.mockResolvedValue({
        ...mockAccount,
        balance: 6000, // Updated balance
      });

      const result = await transactionService.createTransaction(transactionParams);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(transactionParams);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(transactionParams.accountId);
      expect(mockAccountRepository.update).toHaveBeenCalledWith(transactionParams.accountId, {
        balance: 6000,
      });
      expect(mockNotificationService.sendTransactionNotification).toHaveBeenCalledWith(
        mockTransaction,
        'created'
      );
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

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(transactionService.createTransaction(transactionParams))
        .rejects
        .toThrow('Account not found');
    });

    it('should handle repository errors', async () => {
      mockTransactionRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(transactionService.createTransaction(transactionParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTransactionById', () => {
    const transactionId = 'trans123';

    it('should return transaction by id', async () => {
      const mockTransaction = {
        id: transactionId,
        type: TransactionType.INCOME,
        amount: 1000,
        description: 'Test transaction',
        accountId: 'acc123',
        category: 'Salary',
        status: TransactionStatus.COMPLETED,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionById(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
    });

    it('should return null for non-existent transaction', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      const result = await transactionService.getTransactionById(transactionId);

      expect(result).toBeNull();
    });
  });

  describe('getTransactions', () => {
    const filters = {
      accountId: 'acc123',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
    };

    it('should return filtered transactions', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          type: TransactionType.INCOME,
          amount: 1000,
          description: 'Transaction 1',
          accountId: 'acc123',
          category: 'Salary',
          status: TransactionStatus.COMPLETED,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'trans2',
          type: TransactionType.INCOME,
          amount: 2000,
          description: 'Transaction 2',
          accountId: 'acc123',
          category: 'Bonus',
          status: TransactionStatus.COMPLETED,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await transactionService.getTransactions(filters);

      expect(result).toEqual(mockTransactions);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no transactions match filters', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      const result = await transactionService.getTransactions(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateTransaction', () => {
    const transactionId = 'trans123';
    const updateParams = {
      description: 'Updated transaction',
      category: 'Updated Category',
    };

    it('should update transaction successfully', async () => {
      const mockTransaction = {
        id: transactionId,
        type: TransactionType.INCOME,
        amount: 1000,
        description: 'Test transaction',
        accountId: 'acc123',
        category: 'Salary',
        status: TransactionStatus.COMPLETED,
        date: new Date(),
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        ...updateParams,
        updatedAt: new Date(),
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.update.mockResolvedValue(mockUpdatedTransaction);

      const result = await transactionService.updateTransaction(transactionId, updateParams);

      expect(result).toEqual(mockUpdatedTransaction);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockTransactionRepository.update).toHaveBeenCalledWith(transactionId, updateParams);
      expect(mockNotificationService.sendTransactionNotification).toHaveBeenCalledWith(
        mockUpdatedTransaction,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        amount: -1000, // Invalid negative amount
      };

      await expect(transactionService.updateTransaction(transactionId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent transaction', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(transactionService.updateTransaction(transactionId, updateParams))
        .rejects
        .toThrow('Transaction not found');
    });
  });

  describe('deleteTransaction', () => {
    const transactionId = 'trans123';

    it('should delete transaction successfully', async () => {
      const mockTransaction = {
        id: transactionId,
        type: TransactionType.INCOME,
        amount: 1000,
        accountId: 'acc123',
        status: TransactionStatus.COMPLETED,
      };

      const mockAccount = {
        id: 'acc123',
        balance: 6000,
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.delete.mockResolvedValue({
        id: transactionId,
        deleted: true,
        updatedAt: new Date(),
      });
      mockAccountRepository.update.mockResolvedValue({
        ...mockAccount,
        balance: 5000, // Updated balance after deletion
      });

      const result = await transactionService.deleteTransaction(transactionId);

      expect(result).toEqual({
        id: transactionId,
        deleted: true,
        updatedAt: expect.any(Date),
      });
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(transactionId);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(mockTransaction.accountId);
      expect(mockTransactionRepository.delete).toHaveBeenCalledWith(transactionId);
      expect(mockAccountRepository.update).toHaveBeenCalledWith(mockTransaction.accountId, {
        balance: 5000,
      });
      expect(mockNotificationService.sendTransactionNotification).toHaveBeenCalledWith(
        { id: transactionId, deleted: true, updatedAt: expect.any(Date) },
        'deleted'
      );
    });

    it('should handle non-existent transaction', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(transactionService.deleteTransaction(transactionId))
        .rejects
        .toThrow('Transaction not found');
    });

    it('should handle non-existent account', async () => {
      mockTransactionRepository.findById.mockResolvedValue({
        id: transactionId,
        type: TransactionType.INCOME,
        amount: 1000,
        accountId: 'acc123',
        status: TransactionStatus.COMPLETED,
      });
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(transactionService.deleteTransaction(transactionId))
        .rejects
        .toThrow('Account not found');
    });
  });

  describe('getTransactionSummary', () => {
    const accountId = 'acc123';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    it('should return transaction summary', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          type: TransactionType.INCOME,
          amount: 1000,
          category: 'Salary',
          status: TransactionStatus.COMPLETED,
        },
        {
          id: 'trans2',
          type: TransactionType.EXPENSE,
          amount: 500,
          category: 'Food',
          status: TransactionStatus.COMPLETED,
        },
        {
          id: 'trans3',
          type: TransactionType.INCOME,
          amount: 2000,
          category: 'Bonus',
          status: TransactionStatus.COMPLETED,
        },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await transactionService.getTransactionSummary(accountId, startDate, endDate);

      expect(result).toEqual({
        totalIncome: 3000,
        totalExpenses: 500,
        netAmount: 2500,
        transactionsByCategory: {
          Salary: 1000,
          Food: 500,
          Bonus: 2000,
        },
        transactionsByType: {
          [TransactionType.INCOME]: 2,
          [TransactionType.EXPENSE]: 1,
        },
      });
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        accountId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        status: TransactionStatus.COMPLETED,
      });
    });

    it('should handle repository errors', async () => {
      mockTransactionRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(transactionService.getTransactionSummary(accountId, startDate, endDate))
        .rejects
        .toThrow('Database error');
    });
  });
}); 