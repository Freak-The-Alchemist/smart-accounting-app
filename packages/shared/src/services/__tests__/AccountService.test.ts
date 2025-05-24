import { AccountService } from '../AccountService';
import { Account, AccountType, AccountStatus, AccountCategory } from '../../models/Account';
import { SUPPORTED_CURRENCIES } from '../../models/Currency';
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
    mockAccountRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAccountsByOrganization: jest.fn(),
      getAccountsByType: jest.fn(),
      getAccountsByStatus: jest.fn(),
      getAccountSummary: jest.fn(),
    } as any;

    mockTransactionRepository = {
      find: jest.fn(),
    } as any;

    mockNotificationService = {
      sendAccountNotification: jest.fn(),
    } as any;

    // Initialize service with mocked dependencies
    accountService = new AccountService(
      mockAccountRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  const mockAccount: Account = {
    id: '1',
    code: 'ACC001',
    name: 'Test Account',
    type: AccountType.ASSET,
    category: AccountCategory.BANK,
    status: AccountStatus.ACTIVE,
    currency: SUPPORTED_CURRENCIES[0],
    organizationId: 'org1',
    balances: [],
    transactions: [],
    reconciliations: [],
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
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
        ...mockAccount,
        name: '', // Invalid empty name
      };

      await expect(accountService.createAccount(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockAccountRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(accountService.createAccount(mockAccount))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getAccount', () => {
    it('should return an account by id', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);

      const result = await accountService.getAccount(accountParams);

      expect(result).toEqual(mockAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountParams.id);
    });

    it('should return null for non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      const result = await accountService.getAccount(mockAccount);

      expect(result).toBeNull();
    });
  });

  describe('getAccounts', () => {
    it('should return all accounts', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      mockAccountRepository.find.mockResolvedValue([mockAccount]);

      const result = await accountService.getAccounts(accountParams);

      expect(result).toEqual([mockAccount]);
      expect(mockAccountRepository.find).toHaveBeenCalledWith(accountParams);
    });

    it('should return empty array when no accounts match filters', async () => {
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await accountService.getAccounts(mockAccount);

      expect(result).toEqual([]);
    });
  });

  describe('updateAccount', () => {
    it('should update an account', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      const mockUpdatedAccount = {
        ...mockAccount,
        ...accountParams,
        updatedAt: new Date(),
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockAccountRepository.update.mockResolvedValue(mockUpdatedAccount);

      const result = await accountService.updateAccount(accountParams.id, accountParams);

      expect(result).toEqual(mockUpdatedAccount);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountParams.id);
      expect(mockAccountRepository.update).toHaveBeenCalledWith(accountParams.id, accountParams);
      expect(mockNotificationService.sendAccountNotification).toHaveBeenCalledWith(
        mockUpdatedAccount,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...mockAccount,
        name: '', // Invalid empty name
      };

      await expect(accountService.updateAccount(mockAccount.id, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.updateAccount(mockAccount.id, mockAccount))
        .rejects
        .toThrow('Account not found');
    });
  });

  describe('deleteAccount', () => {
    it('should delete an account', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.find.mockResolvedValue([]);
      mockAccountRepository.delete.mockResolvedValue({
        id: accountParams.id,
        deleted: true,
        updatedAt: new Date(),
      });

      const result = await accountService.deleteAccount(accountParams.id);

      expect(result).toEqual({
        id: accountParams.id,
        deleted: true,
        updatedAt: expect.any(Date),
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountParams.id);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({ accountId: accountParams.id });
      expect(mockAccountRepository.delete).toHaveBeenCalledWith(accountParams.id);
      expect(mockNotificationService.sendAccountNotification).toHaveBeenCalledWith(
        { id: accountParams.id, deleted: true, updatedAt: expect.any(Date) },
        'deleted'
      );
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.deleteAccount(mockAccount.id))
        .rejects
        .toThrow('Account not found');
    });

    it('should prevent deletion of account with transactions', async () => {
      const mockAccount = {
        id: '1',
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        status: AccountStatus.ACTIVE,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        balances: [],
        transactions: [],
        reconciliations: [],
        createdBy: 'user1',
        updatedBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransactions = [
        {
          id: 'trans1',
          accountId: '1',
          amount: 100,
          type: 'INCOME',
        },
      ];

      mockAccountRepository.findById.mockResolvedValue(mockAccount);
      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(accountService.deleteAccount(mockAccount.id))
        .rejects
        .toThrow('Cannot delete account with existing transactions');
    });
  });

  describe('getAccountTransactions', () => {
    it('should return account transactions', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      mockTransactionRepository.find.mockResolvedValue([
        {
          id: 'trans1',
          accountId: '1',
          amount: 100,
          type: 'INCOME',
        },
      ]);

      const result = await accountService.getAccountTransactions(accountParams);

      expect(result).toEqual([
        {
          id: 'trans1',
          accountId: '1',
          amount: 100,
          type: 'INCOME',
        },
      ]);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({ accountId: '1' });
    });

    it('should return empty array when no transactions found', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      const result = await accountService.getAccountTransactions(mockAccount);

      expect(result).toEqual([]);
    });
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
      };

      mockAccountRepository.findById.mockResolvedValue(mockAccount);

      const result = await accountService.getAccountBalance(accountParams);

      expect(result).toEqual(mockAccount.balances[0].amount);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountParams.id);
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.getAccountBalance(mockAccount))
        .rejects
        .toThrow('Account not found');
    });
  });

  describe('getAccountSummary', () => {
    it('should return account summary', async () => {
      const accountParams = {
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        currency: SUPPORTED_CURRENCIES[0],
        organizationId: 'org1',
        createdBy: 'user1'
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

      const result = await accountService.getAccountSummary(accountParams.id);

      expect(result).toEqual({
        account: mockAccount,
        totalIncome: 800,
        totalExpenses: 200,
        netAmount: 600,
        transactionCount: 3,
        lastTransactionDate: expect.any(Date),
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountParams.id);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        accountId: accountParams.id,
        status: 'COMPLETED',
      });
    });

    it('should handle non-existent account', async () => {
      mockAccountRepository.findById.mockResolvedValue(null);

      await expect(accountService.getAccountSummary(mockAccount.id))
        .rejects
        .toThrow('Account not found');
    });

    it('should handle repository errors', async () => {
      mockAccountRepository.findById.mockResolvedValue({
        id: mockAccount.id,
        name: 'Test Account',
        type: AccountType.ASSET,
        currency: 'USD',
        balance: 1000,
        status: AccountStatus.ACTIVE,
      });
      mockTransactionRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(accountService.getAccountSummary(mockAccount.id))
        .rejects
        .toThrow('Database error');
    });
  });
}); 