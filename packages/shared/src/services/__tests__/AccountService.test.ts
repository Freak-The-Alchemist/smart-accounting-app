import { AccountService } from '../AccountService';
import { Account, AccountType, AccountStatus } from '../../models/Account';
import { AccountRepository } from '../../repositories/AccountRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/AccountRepository');
jest.mock('../../repositories/TransactionRepository');
jest.mock('../NotificationService');

describe('AccountService', () => {
  let accountService: AccountService;
  let mockAccountRepository: jest.Mocked<AccountRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockAccountRepository = new AccountRepository() as jest.Mocked<AccountRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    accountService = new AccountService(
      mockAccountRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  describe('createAccount', () => {
    const accountParams = {
      name: 'Test Account',
      type: AccountType.CHECKING,
      currency: 'USD',
      balance: 1000,
      description: 'Test account description',
      metadata: {
        accountNumber: '1234567890',
        bankName: 'Test Bank',
      },
    };

    it('should create account successfully', async () => {
      const mockAccount = {
        id: 'acc123',
        ...accountParams,
        status: AccountStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAccountRepository.create.mockResolvedValue(mockAccount);

      const result = await accountService.createAccount(accountParams);

      expect(result).toEqual(mockAccount);
      expect(mockAccountRepository.create).toHaveBeenCalledWith(accountParams);
      expect(mockNotificationService.sendAccountNotification).toHaveBeenCalledWith(
        mockAccount,
        'created'
      );
    });

    it('should throw ValidationError for invalid account parameters', async () => {
      const invalidParams = {
        ...accountParams,
        name: '', // Invalid empty name
      };

      await expect(accountService.createAccount(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockAccountRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(accountService.createAccount(accountParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getAccountById', () => {
    const accountId = 'acc123';

    it('should return account by id', async () => {
      const mockAccount = {
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);

      const result = await accountService.getAccountById(accountId);

      expect(result).toEqual(mockAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should return null for non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      const result = await accountService.getAccountById(accountId);

      expect(result).toBeNull();
    });
  });

  describe('getAccounts', () => {
    const filters = {
      type: AccountType.CHECKING,
      status: AccountStatus.ACTIVE,
    };

    it('should return filtered accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc1',
          name: 'Account 1',
          type: AccountType.CHECKING,
          currency: 'USD',
          balance: 1000,
          status: AccountStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'acc2',
          name: 'Account 2',
          type: AccountType.CHECKING,
          currency: 'USD',
          balance: 2000,
          status: AccountStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockAccountRepository.find.mockResolvedValue(mockAccounts);

      const result = await accountService.getAccounts(filters);

      expect(result).toEqual(mockAccounts);
      expect(mockAccountRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no accounts match filters', async () => {
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await accountService.getAccounts(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateAccount', () => {
    const accountId = 'acc123';
    const updateParams = {
      name: 'Updated Account',
      description: 'Updated description',
    };

    it('should update account successfully', async () => {
      const mockAccount = {
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      };

      const mockUpdatedAccount = {
        ...mockAccount,
        ...updateParams,
        updatedAt: new Date(),
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockAccountRepository.update.mockResolvedValue(mockUpdatedAccount);

      const result = await accountService.updateAccount(accountId, updateParams);

      expect(result).toEqual(mockUpdatedAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockAccountRepository.update).toHaveBeenCalledWith(accountId, updateParams);
      expect(mockNotificationService.sendAccountNotification).toHaveBeenCalledWith(
        mockUpdatedAccount,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        name: '', // Invalid empty name
      };

      await expect(accountService.updateAccount(accountId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.updateAccount(accountId, updateParams))
        .rejects
        .toThrow('Account not found');
    });
  });

  describe('deleteAccount', () => {
    const accountId = 'acc123';

    it('should delete account successfully', async () => {
      const mockAccount = {
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.find.mockResolvedValue([]);
      mockAccountRepository.delete.mockResolvedValue({
        id: accountId,
        deleted: true,
        updatedAt: new Date(),
      });

      const result = await accountService.deleteAccount(accountId);

      expect(result).toEqual({
        id: accountId,
        deleted: true,
        updatedAt: expect.any(Date),
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({ accountId });
      expect(mockAccountRepository.delete).toHaveBeenCalledWith(accountId);
      expect(mockNotificationService.sendAccountNotification).toHaveBeenCalledWith(
        { id: accountId, deleted: true, updatedAt: expect.any(Date) },
        'deleted'
      );
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.deleteAccount(accountId))
        .rejects
        .toThrow('Account not found');
    });

    it('should prevent deletion of account with transactions', async () => {
      const mockAccount = {
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      };

      const mockTransactions = [
        {
          id: 'trans1',
          accountId,
          amount: 100,
          type: 'INCOME',
        },
      ];

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(accountService.deleteAccount(accountId))
        .rejects
        .toThrow('Cannot delete account with existing transactions');
    });
  });

  describe('getAccountSummary', () => {
    const accountId = 'acc123';

    it('should return account summary', async () => {
      const mockAccount = {
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      };

      const mockTransactions = [
        {
          id: 'trans1',
          type: 'INCOME',
          amount: 500,
          status: 'COMPLETED',
        },
        {
          id: 'trans2',
          type: 'EXPENSE',
          amount: 200,
          status: 'COMPLETED',
        },
        {
          id: 'trans3',
          type: 'INCOME',
          amount: 300,
          status: 'COMPLETED',
        },
      ];

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await accountService.getAccountSummary(accountId);

      expect(result).toEqual({
        account: mockAccount,
        totalIncome: 800,
        totalExpenses: 200,
        netAmount: 600,
        transactionCount: 3,
        lastTransactionDate: expect.any(Date),
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        accountId,
        status: 'COMPLETED',
      });
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.getAccountSummary(accountId))
        .rejects
        .toThrow('Account not found');
    });

    it('should handle repository errors', async () => {
      mockAccountRepository.findById.mockResolvedValue({
        id: accountId,
        name: 'Test Account',
        type: AccountType.CHECKING,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      });
      mockTransactionRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(accountService.getAccountSummary(accountId))
        .rejects
        .toThrow('Database error');
    });
  });
}); 