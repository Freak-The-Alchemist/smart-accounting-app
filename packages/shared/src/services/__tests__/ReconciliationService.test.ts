import { ReconciliationService } from '../ReconciliationService';
import { Reconciliation, ReconciliationStatus } from '../../models/Reconciliation';
import { ReconciliationRepository } from '../../repositories/ReconciliationRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/ReconciliationRepository');
jest.mock('../../repositories/TransactionRepository');
jest.mock('../NotificationService');

describe('ReconciliationService', () => {
  let reconciliationService: ReconciliationService;
  let mockReconciliationRepository: jest.Mocked<ReconciliationRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockReconciliationRepository = new ReconciliationRepository() as jest.Mocked<ReconciliationRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    reconciliationService = new ReconciliationService(
      mockReconciliationRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  describe('createReconciliation', () => {
    const reconciliationParams = {
      organizationId: 'org123',
      accountId: 'acc123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      openingBalance: 10000,
      closingBalance: 12000,
      transactions: [
        {
          id: 'trans1',
          amount: 2000,
          date: new Date('2024-01-15'),
        },
        {
          id: 'trans2',
          amount: 1000,
          date: new Date('2024-01-20'),
        },
      ],
    };

    it('should create reconciliation successfully', async () => {
      const mockReconciliation = {
        id: 'recon123',
        ...reconciliationParams,
        status: ReconciliationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReconciliationRepository.create.mockResolvedValue(mockReconciliation);

      const result = await reconciliationService.createReconciliation(reconciliationParams);

      expect(result).toEqual(mockReconciliation);
      expect(mockReconciliationRepository.create).toHaveBeenCalledWith(reconciliationParams);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockReconciliation,
        'created'
      );
    });

    it('should throw ValidationError for invalid reconciliation parameters', async () => {
      const invalidParams = {
        ...reconciliationParams,
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'), // Invalid date range
      };

      await expect(reconciliationService.createReconciliation(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockReconciliationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(reconciliationService.createReconciliation(reconciliationParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getReconciliationById', () => {
    const reconciliationId = 'recon123';

    it('should return reconciliation by id', async () => {
      const mockReconciliation = {
        id: reconciliationId,
        organizationId: 'org123',
        accountId: 'acc123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        openingBalance: 10000,
        closingBalance: 12000,
        status: ReconciliationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReconciliationRepository.findById.mockResolvedValue(mockReconciliation);

      const result = await reconciliationService.getReconciliationById(reconciliationId);

      expect(result).toEqual(mockReconciliation);
      expect(mockReconciliationRepository.findById).toHaveBeenCalledWith(reconciliationId);
    });

    it('should return null for non-existent reconciliation', async () => {
      mockReconciliationRepository.findById.mockResolvedValue(null);

      const result = await reconciliationService.getReconciliationById(reconciliationId);

      expect(result).toBeNull();
    });
  });

  describe('getReconciliations', () => {
    const filters = {
      organizationId: 'org123',
      accountId: 'acc123',
      status: ReconciliationStatus.PENDING,
    };

    it('should return filtered reconciliations', async () => {
      const mockReconciliations = [
        {
          id: 'recon1',
          organizationId: 'org123',
          accountId: 'acc123',
          status: ReconciliationStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'recon2',
          organizationId: 'org123',
          accountId: 'acc123',
          status: ReconciliationStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReconciliationRepository.find.mockResolvedValue(mockReconciliations);

      const result = await reconciliationService.getReconciliations(filters);

      expect(result).toEqual(mockReconciliations);
      expect(mockReconciliationRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no reconciliations match filters', async () => {
      mockReconciliationRepository.find.mockResolvedValue([]);

      const result = await reconciliationService.getReconciliations(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateReconciliationStatus', () => {
    const reconciliationId = 'recon123';
    const status = ReconciliationStatus.COMPLETED;

    it('should update reconciliation status successfully', async () => {
      const mockUpdatedReconciliation = {
        id: reconciliationId,
        status,
        updatedAt: new Date(),
      };

      mockReconciliationRepository.updateStatus.mockResolvedValue(mockUpdatedReconciliation);

      const result = await reconciliationService.updateReconciliationStatus(reconciliationId, status);

      expect(result).toEqual(mockUpdatedReconciliation);
      expect(mockReconciliationRepository.updateStatus).toHaveBeenCalledWith(reconciliationId, status);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockUpdatedReconciliation,
        'status_updated'
      );
    });

    it('should handle non-existent reconciliation', async () => {
      mockReconciliationRepository.updateStatus.mockRejectedValue(new Error('Reconciliation not found'));

      await expect(reconciliationService.updateReconciliationStatus(reconciliationId, status))
        .rejects
        .toThrow('Reconciliation not found');
    });
  });

  describe('deleteReconciliation', () => {
    const reconciliationId = 'recon123';

    it('should delete reconciliation successfully', async () => {
      const mockDeletedReconciliation = {
        id: reconciliationId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockReconciliationRepository.delete.mockResolvedValue(mockDeletedReconciliation);

      const result = await reconciliationService.deleteReconciliation(reconciliationId);

      expect(result).toEqual(mockDeletedReconciliation);
      expect(mockReconciliationRepository.delete).toHaveBeenCalledWith(reconciliationId);
      expect(mockNotificationService.sendReconciliationNotification).toHaveBeenCalledWith(
        mockDeletedReconciliation,
        'deleted'
      );
    });

    it('should handle non-existent reconciliation', async () => {
      mockReconciliationRepository.delete.mockRejectedValue(new Error('Reconciliation not found'));

      await expect(reconciliationService.deleteReconciliation(reconciliationId))
        .rejects
        .toThrow('Reconciliation not found');
    });
  });

  describe('getReconciliationSummary', () => {
    const organizationId = 'org123';
    const period = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    };

    it('should return reconciliation summary', async () => {
      const mockReconciliations = [
        {
          id: 'recon1',
          openingBalance: 10000,
          closingBalance: 12000,
          status: ReconciliationStatus.COMPLETED,
        },
        {
          id: 'recon2',
          openingBalance: 12000,
          closingBalance: 15000,
          status: ReconciliationStatus.PENDING,
        },
      ];

      mockReconciliationRepository.find.mockResolvedValue(mockReconciliations);

      const result = await reconciliationService.getReconciliationSummary(organizationId, period);

      expect(result).toEqual({
        totalReconciliations: 2,
        completedReconciliations: 1,
        pendingReconciliations: 1,
        totalBalanceChange: 5000,
      });
      expect(mockReconciliationRepository.find).toHaveBeenCalledWith({
        organizationId,
        period: {
          startDate: period.startDate,
          endDate: period.endDate,
        },
      });
    });

    it('should handle repository errors', async () => {
      mockReconciliationRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reconciliationService.getReconciliationSummary(organizationId, period))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('generateReconciliationReport', () => {
    const params = {
      organizationId: 'org123',
      accountId: 'acc123',
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    };

    it('should generate reconciliation report successfully', async () => {
      const mockReconciliations = [
        {
          id: 'recon1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          openingBalance: 10000,
          closingBalance: 12000,
          status: ReconciliationStatus.COMPLETED,
        },
        {
          id: 'recon2',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-06-30'),
          openingBalance: 12000,
          closingBalance: 15000,
          status: ReconciliationStatus.PENDING,
        },
      ];

      const mockReport = {
        id: 'report123',
        organizationId: params.organizationId,
        accountId: params.accountId,
        period: params.period,
        totalReconciliations: 2,
        completedReconciliations: 1,
        pendingReconciliations: 1,
        totalBalanceChange: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReconciliationRepository.find.mockResolvedValue(mockReconciliations);
      mockReconciliationRepository.createReport.mockResolvedValue(mockReport);

      const result = await reconciliationService.generateReconciliationReport(params);

      expect(result).toEqual(mockReport);
      expect(mockReconciliationRepository.find).toHaveBeenCalledWith({
        organizationId: params.organizationId,
        accountId: params.accountId,
        period: {
          startDate: params.period.startDate,
          endDate: params.period.endDate,
        },
      });
      expect(mockReconciliationRepository.createReport).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockReconciliationRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reconciliationService.generateReconciliationReport(params))
        .rejects
        .toThrow('Database error');
    });
  });
}); 