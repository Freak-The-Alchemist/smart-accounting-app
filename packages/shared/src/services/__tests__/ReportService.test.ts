import { ReportService } from '../ReportService';
import { Report, ReportType, ReportStatus, ReportFormat } from '../../models/Report';
import { Transaction } from '../../models/Transaction';
import { Tax } from '../../models/Tax';
import { BankReconciliation } from '../../models/BankReconciliation';
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
  let mockReportRepository: jest.Mocked<any>;
  let mockTransactionRepository: jest.Mocked<any>;
  let mockTaxRepository: jest.Mocked<any>;
  let mockBankReconciliationRepository: jest.Mocked<any>;
  let mockNotificationService: jest.Mocked<any>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockReportRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockTransactionRepository = {
      find: jest.fn(),
    };

    mockTaxRepository = {
      find: jest.fn(),
    };

    mockBankReconciliationRepository = {
      find: jest.fn(),
    };

    mockNotificationService = {
      sendReportNotification: jest.fn(),
    };

    // Initialize service with mocked dependencies
    reportService = new ReportService(
      mockReportRepository,
      mockTransactionRepository,
      mockTaxRepository,
      mockBankReconciliationRepository,
      mockNotificationService
    );
  });

  describe('createReport', () => {
    it('should create a new report', async () => {
      const reportParams = {
        name: 'Test Report',
        description: 'Test Description',
        type: ReportType.BALANCE_SHEET,
        format: ReportFormat.PDF,
        organizationId: 'org123',
        createdBy: 'user123',
        filters: [],
        columns: [],
        data: [],
      };

      const mockCreatedReport: Report = {
        id: 'report123',
        ...reportParams,
        status: ReportStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReportRepository.create.mockResolvedValue(mockCreatedReport);

      const result = await reportService.createReport(reportParams);

      expect(result).toEqual(mockCreatedReport);
      expect(mockReportRepository.create).toHaveBeenCalledWith(reportParams);
    });

    it('should throw ValidationError for invalid report parameters', async () => {
      const invalidParams = {
        ...reportParams,
        type: 'INVALID_TYPE' as ReportType,
      };

      await expect(reportService.createReport(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockReportRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(reportService.createReport(reportParams))
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
    it('should get reports with filters', async () => {
      const filters = {
        type: ReportType.BALANCE_SHEET,
        status: ReportStatus.COMPLETED,
      };

      const mockReports: Report[] = [
        {
          id: 'report1',
          name: 'Report 1',
          description: 'Description 1',
          type: ReportType.BALANCE_SHEET,
          format: ReportFormat.PDF,
          status: ReportType.BALANCE_SHEET,
          organizationId: 'org123',
          createdBy: 'user123',
          filters: [],
          columns: [],
          data: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'report2',
          name: 'Report 2',
          description: 'Description 2',
          type: ReportType.INCOME_STATEMENT,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          organizationId: 'org123',
          createdBy: 'user123',
          filters: [],
          columns: [],
          data: [],
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
    it('should update report status', async () => {
      const reportId = 'report123';
      const status = ReportStatus.COMPLETED;

      const mockUpdatedReport: Report = {
        id: reportId,
        name: 'Test Report',
        description: 'Test Description',
        type: ReportType.BALANCE_SHEET,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        organizationId: 'org123',
        createdBy: 'user123',
        filters: [],
        columns: [],
        data: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReportRepository.update.mockResolvedValue(mockUpdatedReport);

      const result = await reportService.updateReportStatus(reportId, status);

      expect(result).toEqual(mockUpdatedReport);
      expect(mockReportRepository.update).toHaveBeenCalledWith(reportId, { status });
      expect(mockNotificationService.sendReportNotification).toHaveBeenCalledWith(
        mockUpdatedReport,
        'status_updated'
      );
    });

    it('should handle non-existent report', async () => {
      mockReportRepository.update.mockRejectedValue(new Error('Report not found'));

      await expect(reportService.updateReportStatus(reportId, status))
        .rejects
        .toThrow('Report not found');
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      const reportId = 'report123';

      const mockDeletedReport = {
        id: reportId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockReportRepository.delete.mockResolvedValue(mockDeletedReport);

      const result = await reportService.deleteReport(reportId);

      expect(result).toBe(true);
      expect(mockReportRepository.delete).toHaveBeenCalledWith(reportId);
      expect(mockNotificationService.sendReportNotification).toHaveBeenCalledWith(
        { id: reportId, deleted: true, updatedAt: expect.any(Date) },
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
    it('should get report summary', async () => {
      const organizationId = 'org123';
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const mockReports: Report[] = [
        {
          id: 'report1',
          name: 'Report 1',
          description: 'Description 1',
          type: ReportType.BALANCE_SHEET,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          organizationId: 'org123',
          createdBy: 'user123',
          filters: [],
          columns: [],
          data: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'report2',
          name: 'Report 2',
          description: 'Description 2',
          type: ReportType.INCOME_STATEMENT,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          organizationId: 'org123',
          createdBy: 'user123',
          filters: [],
          columns: [],
          data: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockReportRepository.find.mockResolvedValue(mockReports);

      const result = await reportService.getReportSummary(organizationId, period);

      expect(result).toEqual({
        total: 2,
        byType: {
          [ReportType.BALANCE_SHEET]: 1,
          [ReportType.INCOME_STATEMENT]: 1,
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
    it('should generate financial report', async () => {
      const params = {
        organizationId: 'org123',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
        options: {
          format: ReportFormat.PDF,
          includeCharts: true,
        },
      };

      const mockTransactions: Transaction[] = [
        {
          id: 'tx1',
          organizationId: 'org123',
          accountId: 'acc1',
          type: 'INCOME',
          amount: 1000,
          date: new Date(),
          status: 'COMPLETED',
          reference: 'ref1',
          description: 'Transaction 1',
          currency: 'USD',
          createdBy: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockReport: Report = {
        id: 'report123',
        name: 'Financial Report',
        description: 'Financial Report Description',
        type: ReportType.BALANCE_SHEET,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        organizationId: 'org123',
        createdBy: 'user123',
        filters: [],
        columns: [],
        data: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateFinancialReport(params);

      expect(result).toEqual(mockReport);
      expect(mockTransactionRepository.find).toHaveBeenCalled();
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
    it('should generate tax report', async () => {
      const params = {
        organizationId: 'org123',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
        options: {
          format: ReportFormat.PDF,
          includeCharts: true,
        },
      };

      const mockTaxes: Tax[] = [
        {
          id: 'tax1',
          code: 'TAX001',
          name: 'Tax 1',
          organizationId: 'org123',
          rates: [],
          type: 'INCOME',
          taxableAmount: 1000,
          taxAmount: 100,
          status: 'PAID',
          currency: 'USD',
          createdBy: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockReport: Report = {
        id: 'report123',
        name: 'Tax Report',
        description: 'Tax Report Description',
        type: ReportType.TAX_SUMMARY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        organizationId: 'org123',
        createdBy: 'user123',
        filters: [],
        columns: [],
        data: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaxRepository.find.mockResolvedValue(mockTaxes);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateTaxReport(params);

      expect(result).toEqual(mockReport);
      expect(mockTaxRepository.find).toHaveBeenCalled();
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
    it('should generate reconciliation report', async () => {
      const params = {
        organizationId: 'org123',
        period: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
        options: {
          format: ReportFormat.PDF,
          includeCharts: true,
        },
      };

      const mockReconciliations: BankReconciliation[] = [
        {
          id: 'rec1',
          accountId: 'acc1',
          statementDate: new Date(),
          openingBalance: 1000,
          closingBalance: 2000,
          status: 'COMPLETED',
          currency: 'USD',
          organizationId: 'org123',
          createdBy: 'user123',
          transactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockReport: Report = {
        id: 'report123',
        name: 'Reconciliation Report',
        description: 'Reconciliation Report Description',
        type: ReportType.CUSTOM,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        organizationId: 'org123',
        createdBy: 'user123',
        filters: [],
        columns: [],
        data: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBankReconciliationRepository.find.mockResolvedValue(mockReconciliations);
      mockReportRepository.create.mockResolvedValue(mockReport);

      const result = await reportService.generateReconciliationReport(params);

      expect(result).toEqual(mockReport);
      expect(mockBankReconciliationRepository.find).toHaveBeenCalled();
      expect(mockReportRepository.create).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockBankReconciliationRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(reportService.generateReconciliationReport(params))
        .rejects
        .toThrow('Database error');
    });
  });
}); 