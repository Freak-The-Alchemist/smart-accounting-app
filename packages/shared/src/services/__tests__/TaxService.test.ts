import { TaxService } from '../TaxService';
import { Tax, TaxType, TaxStatus } from '../../models/Tax';
import { TaxRepository } from '../../repositories/TaxRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/TaxRepository');
jest.mock('../../repositories/TransactionRepository');
jest.mock('../NotificationService');

describe('TaxService', () => {
  let taxService: TaxService;
  let mockTaxRepository: jest.Mocked<TaxRepository>;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockTaxRepository = new TaxRepository() as jest.Mocked<TaxRepository>;
    mockTransactionRepository = new TransactionRepository() as jest.Mocked<TransactionRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    taxService = new TaxService(
      mockTaxRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  describe('createTax', () => {
    const taxParams = {
      type: TaxType.INCOME,
      amount: 1000,
      description: 'Test tax',
      dueDate: new Date('2024-12-31'),
      category: 'Income Tax',
      metadata: {
        taxYear: '2024',
        taxPeriod: 'Q4',
      },
    };

    it('should create tax successfully', async () => {
      const mockTax = {
        id: 'tax123',
        ...taxParams,
        status: TaxStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaxRepository.create.mockResolvedValue(mockTax);

      const result = await taxService.createTax(taxParams);

      expect(result).toEqual(mockTax);
      expect(mockTaxRepository.create).toHaveBeenCalledWith(taxParams);
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(
        mockTax,
        'created'
      );
    });

    it('should throw ValidationError for invalid tax parameters', async () => {
      const invalidParams = {
        ...taxParams,
        amount: -1000, // Invalid negative amount
      };

      await expect(taxService.createTax(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockTaxRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(taxService.createTax(taxParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTaxById', () => {
    const taxId = 'tax123';

    it('should return tax by id', async () => {
      const mockTax = {
        id: taxId,
        type: TaxType.INCOME,
        amount: 1000,
        description: 'Test tax',
        dueDate: new Date('2024-12-31'),
        category: 'Income Tax',
        status: TaxStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTaxRepository.findById.mockResolvedValue(mockTax);

      const result = await taxService.getTaxById(taxId);

      expect(result).toEqual(mockTax);
      expect(mockTaxRepository.findById).toHaveBeenCalledWith(taxId);
    });

    it('should return null for non-existent tax', async () => {
      mockTaxRepository.findById.mockResolvedValue(null);

      const result = await taxService.getTaxById(taxId);

      expect(result).toBeNull();
    });
  });

  describe('getTaxes', () => {
    const filters = {
      type: TaxType.INCOME,
      status: TaxStatus.PENDING,
    };

    it('should return filtered taxes', async () => {
      const mockTaxes = [
        {
          id: 'tax1',
          type: TaxType.INCOME,
          amount: 1000,
          description: 'Tax 1',
          dueDate: new Date('2024-12-31'),
          category: 'Income Tax',
          status: TaxStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tax2',
          type: TaxType.INCOME,
          amount: 2000,
          description: 'Tax 2',
          dueDate: new Date('2024-12-31'),
          category: 'Income Tax',
          status: TaxStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTaxRepository.find.mockResolvedValue(mockTaxes);

      const result = await taxService.getTaxes(filters);

      expect(result).toEqual(mockTaxes);
      expect(mockTaxRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no taxes match filters', async () => {
      mockTaxRepository.find.mockResolvedValue([]);

      const result = await taxService.getTaxes(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateTax', () => {
    const taxId = 'tax123';
    const updateParams = {
      description: 'Updated tax',
      category: 'Updated Category',
    };

    it('should update tax successfully', async () => {
      const mockTax = {
        id: taxId,
        type: TaxType.INCOME,
        amount: 1000,
        description: 'Test tax',
        dueDate: new Date('2024-12-31'),
        category: 'Income Tax',
        status: TaxStatus.PENDING,
      };

      const mockUpdatedTax = {
        ...mockTax,
        ...updateParams,
        updatedAt: new Date(),
      };

      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.update.mockResolvedValue(mockUpdatedTax);

      const result = await taxService.updateTax(taxId, updateParams);

      expect(result).toEqual(mockUpdatedTax);
      expect(mockTaxRepository.findById).toHaveBeenCalledWith(taxId);
      expect(mockTaxRepository.update).toHaveBeenCalledWith(taxId, updateParams);
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(
        mockUpdatedTax,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        amount: -1000, // Invalid negative amount
      };

      await expect(taxService.updateTax(taxId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent tax', async () => {
      mockTaxRepository.findById.mockResolvedValue(null);

      await expect(taxService.updateTax(taxId, updateParams))
        .rejects
        .toThrow('Tax not found');
    });
  });

  describe('deleteTax', () => {
    const taxId = 'tax123';

    it('should delete tax successfully', async () => {
      const mockTax = {
        id: taxId,
        type: TaxType.INCOME,
        amount: 1000,
        description: 'Test tax',
        dueDate: new Date('2024-12-31'),
        category: 'Income Tax',
        status: TaxStatus.PENDING,
      };

      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.delete.mockResolvedValue({
        id: taxId,
        deleted: true,
        updatedAt: new Date(),
      });

      const result = await taxService.deleteTax(taxId);

      expect(result).toEqual({
        id: taxId,
        deleted: true,
        updatedAt: expect.any(Date),
      });
      expect(mockTaxRepository.findById).toHaveBeenCalledWith(taxId);
      expect(mockTaxRepository.delete).toHaveBeenCalledWith(taxId);
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(
        { id: taxId, deleted: true, updatedAt: expect.any(Date) },
        'deleted'
      );
    });

    it('should handle non-existent tax', async () => {
      mockTaxRepository.findById.mockResolvedValue(null);

      await expect(taxService.deleteTax(taxId))
        .rejects
        .toThrow('Tax not found');
    });
  });

  describe('getTaxSummary', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    it('should return tax summary', async () => {
      const mockTaxes = [
        {
          id: 'tax1',
          type: TaxType.INCOME,
          amount: 1000,
          category: 'Income Tax',
          status: TaxStatus.PAID,
        },
        {
          id: 'tax2',
          type: TaxType.VAT,
          amount: 500,
          category: 'VAT',
          status: TaxStatus.PENDING,
        },
        {
          id: 'tax3',
          type: TaxType.INCOME,
          amount: 2000,
          category: 'Income Tax',
          status: TaxStatus.PAID,
        },
      ];

      mockTaxRepository.find.mockResolvedValue(mockTaxes);

      const result = await taxService.getTaxSummary(startDate, endDate);

      expect(result).toEqual({
        totalTaxes: 3500,
        paidTaxes: 3000,
        pendingTaxes: 500,
        taxesByCategory: {
          'Income Tax': 3000,
          'VAT': 500,
        },
        taxesByType: {
          [TaxType.INCOME]: 2,
          [TaxType.VAT]: 1,
        },
      });
      expect(mockTaxRepository.find).toHaveBeenCalledWith({
        dueDate: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      });
    });

    it('should handle repository errors', async () => {
      mockTaxRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(taxService.getTaxSummary(startDate, endDate))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('calculateTax', () => {
    const income = 100000;
    const taxYear = '2024';

    it('should calculate tax successfully', async () => {
      const mockTaxRates = [
        {
          minIncome: 0,
          maxIncome: 50000,
          rate: 0.1,
        },
        {
          minIncome: 50001,
          maxIncome: 100000,
          rate: 0.2,
        },
        {
          minIncome: 100001,
          maxIncome: Infinity,
          rate: 0.3,
        },
      ];

      mockTaxRepository.getTaxRates.mockResolvedValue(mockTaxRates);

      const result = await taxService.calculateTax(income, taxYear);

      expect(result).toEqual({
        income,
        taxYear,
        taxAmount: 15000, // (50000 * 0.1) + (50000 * 0.2)
        taxRate: 0.15, // Average tax rate
        taxBrackets: mockTaxRates,
      });
      expect(mockTaxRepository.getTaxRates).toHaveBeenCalledWith(taxYear);
    });

    it('should handle repository errors', async () => {
      mockTaxRepository.getTaxRates.mockRejectedValue(new Error('Database error'));

      await expect(taxService.calculateTax(income, taxYear))
        .rejects
        .toThrow('Database error');
    });
  });
}); 