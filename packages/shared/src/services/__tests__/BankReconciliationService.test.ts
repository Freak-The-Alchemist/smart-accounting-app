import { BankReconciliationService } from '../BankReconciliationService';
import { BankReconciliation, ReconciliationStatus } from '../../models/BankReconciliation';
import { BankReconciliationRepository } from '../../repositories/BankReconciliationRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/BankReconciliationRepository');
jest.mock('../../repositories/TransactionRepository');
jest.mock('../NotificationService');

describe('BankReconciliationService', () => {
  let bankReconciliationService: BankReconciliationService;
  let mockBankReconciliationRepository: jest.Mocked<BankReconciliationRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockBankReconciliationRepository = new BankReconciliationRepository() as jest.Mocked<BankReconciliationRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    bankReconciliationService = new BankReconciliationService(
      mockBankReconciliationRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  describe('createReconciliation', () => {
    const validReconciliation: Partial<BankReconciliation> = {
      statementDate: new Date(),
      account: {
        id: 'acc123',
        name: 'Test Account',
      },
      openingBalance: 10000,
      closingBalance: 12000,
      status: ReconciliationStatus.PENDING,
      currency: 'KES',
      organizationId: 'org123',
      createdBy: 'user123',
    };

    it('should create a valid reconciliation', async () => {
      const mockCreatedReconciliation = {
        id: 'test-id',
        ...validReconciliation,
        createdAt: new Date(),
        updatedAt: new Date(),
        reconciliationSummary: {
          totalCredits: 5000,
          totalDebits: 3000,
          outstandingDeposits: 0,
          outstandingChecks: 0,
        },
      };

      mockBankReconciliationRepository.create.mockResolvedValue(mockCreatedReconciliation);

      const result = await bankReconciliationService.createReconciliation(validReconciliation);

      expect(result).toEqual(mockCreatedReconciliation);
      expect(mockBankReconciliationRepository.create).toHaveBeenCalledWith(validReconciliation);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockCreatedReconciliation,
        'created'
      );
    });

    it('should throw ValidationError for invalid reconciliation', async () => {
      const invalidReconciliation = {
        ...validReconciliation,
        openingBalance: -10000, // Invalid negative balance
      };

      await expect(bankReconciliationService.createReconciliation(invalidReconciliation))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockBankReconciliationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(bankReconciliationService.createReconciliation(validReconciliation))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('updateReconciliation', () => {
    const reconciliationId = 'test-id';
    const updateData: Partial<BankReconciliation> = {
      closingBalance: 15000,
      status: ReconciliationStatus.COMPLETED,
    };

    it('should update a reconciliation successfully', async () => {
      const mockUpdatedReconciliation = {
        id: reconciliationId,
        ...updateData,
        updatedAt: new Date(),
      };

      mockBankReconciliationRepository.update.mockResolvedValue(mockUpdatedReconciliation);

      const result = await bankReconciliationService.updateReconciliation(reconciliationId, updateData);

      expect(result).toEqual(mockUpdatedReconciliation);
      expect(mockBankReconciliationRepository.update).toHaveBeenCalledWith(reconciliationId, updateData);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockUpdatedReconciliation,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update data', async () => {
      const invalidUpdateData = {
        closingBalance: -15000, // Invalid negative balance
      };

      await expect(bankReconciliationService.updateReconciliation(reconciliationId, invalidUpdateData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('deleteReconciliation', () => {
    const reconciliationId = 'test-id';

    it('should delete a reconciliation successfully', async () => {
      const mockDeletedReconciliation = {
        id: reconciliationId,
        status: ReconciliationStatus.DELETED,
        updatedAt: new Date(),
      };

      mockBankReconciliationRepository.delete.mockResolvedValue(mockDeletedReconciliation);

      const result = await bankReconciliationService.deleteReconciliation(reconciliationId);

      expect(result).toEqual(mockDeletedReconciliation);
      expect(mockBankReconciliationRepository.delete).toHaveBeenCalledWith(reconciliationId);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockDeletedReconciliation,
        'deleted'
      );
    });

    it('should handle non-existent reconciliation', async () => {
      mockBankReconciliationRepository.delete.mockRejectedValue(new Error('Reconciliation not found'));

      await expect(bankReconciliationService.deleteReconciliation(reconciliationId))
        .rejects
        .toThrow('Reconciliation not found');
    });
  });

  describe('getReconciliationById', () => {
    const reconciliationId = 'test-id';

    it('should return a reconciliation by id', async () => {
      const mockReconciliation = {
        id: reconciliationId,
        statementDate: new Date(),
        account: {
          id: 'acc123',
          name: 'Test Account',
        },
        openingBalance: 10000,
        closingBalance: 12000,
        status: ReconciliationStatus.COMPLETED,
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

      mockBankReconciliationRepository.findById.mockResolvedValue(mockReconciliation);

      const result = await bankReconciliationService.getReconciliationById(reconciliationId);

      expect(result).toEqual(mockReconciliation);
      expect(mockBankReconciliationRepository.findById).toHaveBeenCalledWith(reconciliationId);
    });

    it('should return null for non-existent reconciliation', async () => {
      mockBankReconciliationRepository.findById.mockResolvedValue(null);

      const result = await bankReconciliationService.getReconciliationById(reconciliationId);

      expect(result).toBeNull();
    });
  });

  describe('getReconciliations', () => {
    const filters = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ReconciliationStatus.PENDING,
      organizationId: 'org123',
    };

    it('should return filtered reconciliations', async () => {
      const mockReconciliations = [
        {
          id: '1',
          statementDate: new Date(),
          account: {
            id: 'acc123',
            name: 'Test Account',
          },
          openingBalance: 10000,
          closingBalance: 12000,
          status: ReconciliationStatus.PENDING,
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
        },
        {
          id: '2',
          statementDate: new Date(),
          account: {
            id: 'acc123',
            name: 'Test Account',
          },
          openingBalance: 12000,
          closingBalance: 15000,
          status: ReconciliationStatus.PENDING,
          currency: 'KES',
          organizationId: 'org123',
          createdBy: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
          reconciliationSummary: {
            totalCredits: 8000,
            totalDebits: 5000,
            outstandingDeposits: 0,
            outstandingChecks: 0,
          },
        },
      ];

      mockBankReconciliationRepository.find.mockResolvedValue(mockReconciliations);

      const result = await bankReconciliationService.getReconciliations(filters);

      expect(result).toEqual(mockReconciliations);
      expect(mockBankReconciliationRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no reconciliations match filters', async () => {
      mockBankReconciliationRepository.find.mockResolvedValue([]);

      const result = await bankReconciliationService.getReconciliations(filters);

      expect(result).toEqual([]);
    });
  });

  describe('getReconciliationSummary', () => {
    const dateRange = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    };

    it('should return reconciliation summary', async () => {
      const mockReconciliations = [
        {
          id: '1',
          statementDate: new Date(),
          account: {
            id: 'acc123',
            name: 'Test Account',
          },
          openingBalance: 10000,
          closingBalance: 12000,
          status: ReconciliationStatus.COMPLETED,
          currency: 'KES',
          organizationId: 'org123',
          createdBy: 'user123',
          reconciliationSummary: {
            totalCredits: 5000,
            totalDebits: 3000,
            outstandingDeposits: 0,
            outstandingChecks: 0,
          },
        },
        {
          id: '2',
          statementDate: new Date(),
          account: {
            id: 'acc123',
            name: 'Test Account',
          },
          openingBalance: 12000,
          closingBalance: 15000,
          status: ReconciliationStatus.PENDING,
          currency: 'KES',
          organizationId: 'org123',
          createdBy: 'user123',
          reconciliationSummary: {
            totalCredits: 8000,
            totalDebits: 5000,
            outstandingDeposits: 0,
            outstandingChecks: 0,
          },
        },
      ];

      mockBankReconciliationRepository.find.mockResolvedValue(mockReconciliations);

      const result = await bankReconciliationService.getReconciliationSummary(dateRange);

      expect(result).toEqual({
        totalReconciliations: 2,
        completedReconciliations: 1,
        pendingReconciliations: 1,
        totalCredits: 13000,
        totalDebits: 8000,
        totalOutstandingDeposits: 0,
        totalOutstandingChecks: 0,
      });
    });

    it('should handle empty reconciliation list', async () => {
      mockBankReconciliationRepository.find.mockResolvedValue([]);

      const result = await bankReconciliationService.getReconciliationSummary(dateRange);

      expect(result).toEqual({
        totalReconciliations: 0,
        completedReconciliations: 0,
        pendingReconciliations: 0,
        totalCredits: 0,
        totalDebits: 0,
        totalOutstandingDeposits: 0,
        totalOutstandingChecks: 0,
      });
    });
  });

  describe('matchTransactions', () => {
    const reconciliationId = 'test-id';
    const transactionIds = ['txn1', 'txn2'];

    it('should match transactions successfully', async () => {
      const mockUpdatedReconciliation = {
        id: reconciliationId,
        status: ReconciliationStatus.IN_PROGRESS,
        updatedAt: new Date(),
        matchedTransactions: transactionIds,
      };

      mockBankReconciliationRepository.update.mockResolvedValue(mockUpdatedReconciliation);

      const result = await bankReconciliationService.matchTransactions(reconciliationId, transactionIds);

      expect(result).toEqual(mockUpdatedReconciliation);
      expect(mockBankReconciliationRepository.update).toHaveBeenCalledWith(
        reconciliationId,
        expect.objectContaining({
          matchedTransactions: transactionIds,
        })
      );
    });

    it('should handle non-existent reconciliation', async () => {
      mockBankReconciliationRepository.update.mockRejectedValue(new Error('Reconciliation not found'));

      await expect(bankReconciliationService.matchTransactions(reconciliationId, transactionIds))
        .rejects
        .toThrow('Reconciliation not found');
    });
  });
}); 