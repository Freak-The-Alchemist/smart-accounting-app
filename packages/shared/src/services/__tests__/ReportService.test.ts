import { ReportService } from '../ReportService';
import { Report, ReportType, ReportStatus } from '../../models/Report';
import { ReportRepository } from '../../repositories/ReportRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { TaxRepository } from '../../repositories/TaxRepository';
import { ReconciliationRepository } from '../../repositories/ReconciliationRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/ReportRepository');
jest.mock('../../repositories/TransactionRepository');
jest.mock('../../repositories/TaxRepository');
jest.mock('../../repositories/ReconciliationRepository');
jest.mock('../NotificationService');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockReportRepository: jest.Mocked<ReportRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockTaxRepository: jest.Mocked<TaxRepository>;
  let mockReconciliationRepository: jest.Mocked<ReconciliationRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockReportRepository = new ReportRepository() as jest.Mocked<ReportRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockTaxRepository = new TaxRepository() as jest.Mocked<TaxRepository>;
    mockReconciliationRepository = new ReconciliationRepository() as jest.Mocked<ReconciliationRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    reportService = new ReportService(
      mockReportRepository,
      mockTransactionRepository,
      mockTaxRepository,
      mockReconciliationRepository,
      mockNotificationService
    );
  });

  describe('generateReport', () => {
    const reportParams = {
      organizationId: 'org123',
      type: ReportType.FINANCIAL,
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
      filters: {
        accountId: 'acc123',
        categoryId: 'cat123',
      },
    };

    it('should generate report successfully', async () => {
      const mockReport = {
        id: 'report123',
        ...reportParams,
        status: ReportStatus.COMPLETED,
        data: {
          totalIncome: 50000,
          totalExpenses: 30000,
          netIncome: 20000,
          transactions: [
            {
              id: 'trans1',
              type: 'INCOME',
              amount: 30000,
              date: new Date('2024-01-15'),
            },
            {
              id: 'trans2',
              type: 'EXPENSE',
              amount: 20000,
              date: new Date('2024-02-20'),
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateReport(reportParams);

      expect(result).toEqual(mockReport);
      expect(mockReportRepository.create).toHaveBeenCalledWith(reportParams);
      expect(mockNotificationService.sendReportNotification).toHaveBeenCalledWith(
        mockReport,
        'generated'
      );
    });

    it('should throw ValidationError for invalid report parameters', async () => {
      const invalidParams = {
        ...reportParams,
        type: 'INVALID_TYPE' as ReportType,
      };

      await expect(reportService.generateReport(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockReportRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(reportService.generateReport(reportParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getReportById', () => {
    const reportId = 'report123';

    it('should return report by id', async () => {
      const mockReport = {
        id: reportId,
        organizationId: 'org123',
        type: ReportType.FINANCIAL,
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
        status: ReportStatus.COMPLETED,
        data: {
          totalIncome: 50000,
          totalExpenses: 30000,
          netIncome: 20000,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReportRepository.findById.mockResolvedValue(mockReport);

      const result = await reportService.getReportById(reportId);

      expect(result).toEqual(mockReport);
      expect(mockReportRepository.findById).toHaveBeenCalledWith(reportId);
    });

    it('should return null for non-existent report', async () => {
      mockReportRepository.findById.mockResolvedValue(null);

      const result = await reportService.getReportById(reportId);

      expect(result).toBeNull();
    });
  });

  describe('getReports', () => {
    const filters = {
      organizationId: 'org123',
      type: ReportType.FINANCIAL,
      status: ReportStatus.COMPLETED,
    };

    it('should return filtered reports', async () => {
      const mockReports = [
        {
          id: 'report1',
          organizationId: 'org123',
          type: ReportType.FINANCIAL,
          status: ReportStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'report2',
          organizationId: 'org123',
          type: ReportType.FINANCIAL,
          status: ReportStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReportRepository.find.mockResolvedValue(mockReports);

      const result = await reportService.getReports(filters);

      expect(result).toEqual(mockReports);
      expect(mockReportRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no reports match filters', async () => {
      mockReportRepository.find.mockResolvedValue([]);

      const result = await reportService.getReports(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateReportStatus', () => {
    const reportId = 'report123';
    const status = ReportStatus.FAILED;

    it('should update report status successfully', async () => {
      const mockUpdatedReport = {
        id: reportId,
        status,
        updatedAt: new Date(),
      };

      mockReportRepository.updateStatus.mockResolvedValue(mockUpdatedReport);

      const result = await reportService.updateReportStatus(reportId, status);

      expect(result).toEqual(mockUpdatedReport);
      expect(mockReportRepository.updateStatus).toHaveBeenCalledWith(reportId, status);
      expect(mockNotificationService.sendReportNotification).toHaveBeenCalledWith(
        mockUpdatedReport,
        'status_updated'
      );
    });

    it('should handle non-existent report', async () => {
      mockReportRepository.updateStatus.mockRejectedValue(new Error('Report not found'));

      await expect(reportService.updateReportStatus(reportId, status))
        .rejects
        .toThrow('Report not found');
    });
  });

  describe('deleteReport', () => {
    const reportId = 'report123';

    it('should delete report successfully', async () => {
      const mockDeletedReport = {
        id: reportId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockReportRepository.delete.mockResolvedValue(mockDeletedReport);

      const result = await reportService.deleteReport(reportId);

      expect(result).toEqual(mockDeletedReport);
      expect(mockReportRepository.delete).toHaveBeenCalledWith(reportId);
      expect(mockNotificationService.sendReportNotification).toHaveBeenCalledWith(
        mockDeletedReport,
        'deleted'
      );
    });

    it('should handle non-existent report', async () => {
      mockReportRepository.delete.mockRejectedValue(new Error('Report not found'));

      await expect(reportService.deleteReport(reportId))
        .rejects
        .toThrow('Report not found');
    });
  });

  describe('getReportSummary', () => {
    const organizationId = 'org123';
    const period = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    };

    it('should return report summary', async () => {
      const mockReports = [
        {
          id: 'report1',
          type: ReportType.FINANCIAL,
          status: ReportStatus.COMPLETED,
        },
        {
          id: 'report2',
          type: ReportType.TAX,
          status: ReportStatus.COMPLETED,
        },
        {
          id: 'report3',
          type: ReportType.FINANCIAL,
          status: ReportStatus.FAILED,
        },
      ];

      mockReportRepository.find.mockResolvedValue(mockReports);

      const result = await reportService.getReportSummary(organizationId, period);

      expect(result).toEqual({
        totalReports: 3,
        completedReports: 2,
        failedReports: 1,
        reportsByType: {
          [ReportType.FINANCIAL]: 2,
          [ReportType.TAX]: 1,
        },
      });
      expect(mockReportRepository.find).toHaveBeenCalledWith({
        organizationId,
        period: {
          startDate: period.startDate,
          endDate: period.endDate,
        },
      });
    });

    it('should handle repository errors', async () => {
      mockReportRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reportService.getReportSummary(organizationId, period))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('generateFinancialReport', () => {
    const params = {
      organizationId: 'org123',
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
      filters: {
        accountId: 'acc123',
        categoryId: 'cat123',
      },
    };

    it('should generate financial report successfully', async () => {
      const mockTransactions = [
        {
          id: 'trans1',
          type: 'INCOME',
          amount: 30000,
          date: new Date('2024-01-15'),
        },
        {
          id: 'trans2',
          type: 'EXPENSE',
          amount: 20000,
          date: new Date('2024-02-20'),
        },
      ];

      const mockReport = {
        id: 'report123',
        organizationId: params.organizationId,
        type: ReportType.FINANCIAL,
        period: params.period,
        status: ReportStatus.COMPLETED,
        data: {
          totalIncome: 30000,
          totalExpenses: 20000,
          netIncome: 10000,
          transactions: mockTransactions,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateFinancialReport(params);

      expect(result).toEqual(mockReport);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        organizationId: params.organizationId,
        date: {
          $gte: params.period.startDate,
          $lte: params.period.endDate,
        },
        ...params.filters,
      });
      expect(mockReportRepository.create).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockTransactionRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reportService.generateFinancialReport(params))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('generateTaxReport', () => {
    const params = {
      organizationId: 'org123',
      period: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    };

    it('should generate tax report successfully', async () => {
      const mockTaxes = [
        {
          id: 'tax1',
          type: 'VAT',
          taxableAmount: 100000,
          taxAmount: 16000,
          status: 'PAID',
        },
        {
          id: 'tax2',
          type: 'INCOME_TAX',
          taxableAmount: 50000,
          taxAmount: 10000,
          status: 'PENDING',
        },
      ];

      const mockReport = {
        id: 'report123',
        organizationId: params.organizationId,
        type: ReportType.TAX,
        period: params.period,
        status: ReportStatus.COMPLETED,
        data: {
          totalTaxableAmount: 150000,
          totalTaxAmount: 26000,
          paidTaxAmount: 16000,
          pendingTaxAmount: 10000,
          taxes: mockTaxes,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaxRepository.find.mockResolvedValue(mockTaxes);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateTaxReport(params);

      expect(result).toEqual(mockReport);
      expect(mockTaxRepository.find).toHaveBeenCalledWith({
        organizationId: params.organizationId,
        period: {
          startDate: params.period.startDate,
          endDate: params.period.endDate,
        },
      });
      expect(mockReportRepository.create).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockTaxRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reportService.generateTaxReport(params))
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
          openingBalance: 10000,
          closingBalance: 12000,
          status: 'COMPLETED',
        },
        {
          id: 'recon2',
          openingBalance: 12000,
          closingBalance: 15000,
          status: 'PENDING',
        },
      ];

      const mockReport = {
        id: 'report123',
        organizationId: params.organizationId,
        type: ReportType.RECONCILIATION,
        period: params.period,
        status: ReportStatus.COMPLETED,
        data: {
          totalReconciliations: 2,
          completedReconciliations: 1,
          pendingReconciliations: 1,
          totalBalanceChange: 5000,
          reconciliations: mockReconciliations,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReconciliationRepository.find.mockResolvedValue(mockReconciliations);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateReconciliationReport(params);

      expect(result).toEqual(mockReport);
      expect(mockReconciliationRepository.find).toHaveBeenCalledWith({
        organizationId: params.organizationId,
        accountId: params.accountId,
        period: {
          startDate: params.period.startDate,
          endDate: params.period.endDate,
        },
      });
      expect(mockReportRepository.create).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockReconciliationRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reportService.generateReconciliationReport(params))
        .rejects
        .toThrow('Database error');
    });
  });
}); 