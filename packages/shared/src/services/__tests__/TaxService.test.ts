import { Tax, TaxType, TaxStatus, TaxCalculationType, TaxFilters } from '../../models/Tax';
import { SUPPORTED_CURRENCIES } from '../../models/Currency';
import { TaxService } from '../TaxService';
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

  const mockTax: Tax = {
    id: 'tax-1',
    code: 'VAT',
    name: 'Value Added Tax',
    type: TaxType.VAT,
    status: TaxStatus.ACTIVE,
    organizationId: 'org-1',
    description: 'Standard VAT rate',
    rates: [{
      id: 'rate-1',
      rate: 20,
      type: TaxCalculationType.PERCENTAGE,
      effectiveFrom: new Date(),
      currency: SUPPORTED_CURRENCIES[0]
    }],
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const taxParams = {
    code: 'VAT',
    name: 'Value Added Tax',
    type: TaxType.VAT,
    status: TaxStatus.ACTIVE,
    organizationId: 'org-1',
    description: 'Standard VAT rate',
    rates: [{
      id: 'rate-1',
      rate: 20,
      type: TaxCalculationType.PERCENTAGE,
      effectiveFrom: new Date(),
      currency: SUPPORTED_CURRENCIES[0]
    }],
    createdBy: 'user-1',
    updatedBy: 'user-1'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockTaxRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getTaxRates: jest.fn(),
    } as any;

    mockTransactionRepository = {
      find: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockNotificationService = {
      sendTaxNotification: jest.fn(),
    } as any;

    // Initialize service with mocked dependencies
    taxService = new TaxService(
      mockTaxRepository,
      mockTransactionRepository,
      mockNotificationService
    );
  });

  describe('createTax', () => {
    it('should create a tax record successfully', async () => {
      mockTaxRepository.create.mockResolvedValue(mockTax);

      const result = await taxService.createTax(taxParams);

      expect(result).toEqual(mockTax);
      expect(mockTaxRepository.create).toHaveBeenCalledWith(taxParams);
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(mockTax, 'created');
    });

    it('should throw ValidationError for invalid tax parameters', async () => {
      const invalidParams = {
        ...taxParams,
        rates: [{
          id: 'rate-1',
          rate: -20, // Invalid negative rate
          type: TaxCalculationType.PERCENTAGE,
          effectiveFrom: new Date(),
          currency: SUPPORTED_CURRENCIES[0]
        }]
      };

      await expect(taxService.createTax(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when tax creation fails', async () => {
      mockTaxRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(taxService.createTax(taxParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTaxById', () => {
    it('should return a tax record by id', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);

      const result = await taxService.getTaxById('tax-1');

      expect(result).toEqual(mockTax);
      expect(mockTaxRepository.findById).toHaveBeenCalledWith('tax-1');
    });

    it('should return null when tax is not found', async () => {
      mockTaxRepository.findById.mockResolvedValue(null);

      const result = await taxService.getTaxById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error when tax retrieval fails', async () => {
      mockTaxRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(taxService.getTaxById('tax-1'))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTaxes', () => {
    const mockTaxes = [mockTax];

    it('should return all taxes for an organization', async () => {
      mockTaxRepository.find.mockResolvedValue(mockTaxes);

      const filters: TaxFilters = {};
      const result = await taxService.getTaxes(filters);

      expect(result).toEqual(mockTaxes);
      expect(mockTaxRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return filtered taxes based on criteria', async () => {
      mockTaxRepository.find.mockResolvedValue(mockTaxes);

      const filters: TaxFilters = {
        type: TaxType.VAT,
        status: TaxStatus.ACTIVE
      };
      const result = await taxService.getTaxes(filters);

      expect(result).toEqual(mockTaxes);
      expect(mockTaxRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should throw error when tax retrieval fails', async () => {
      mockTaxRepository.find.mockRejectedValue(new Error('Database error'));

      const filters: TaxFilters = {};
      await expect(taxService.getTaxes(filters))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('updateTax', () => {
    const mockUpdatedTax: Tax = {
      ...mockTax,
      description: 'Updated VAT rate',
      updatedAt: new Date()
    };

    it('should update a tax record successfully', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.update.mockResolvedValue(mockUpdatedTax);

      const result = await taxService.updateTax('tax-1', {
        description: 'Updated VAT rate'
      });

      expect(result).toEqual(mockUpdatedTax);
      expect(mockTaxRepository.update).toHaveBeenCalledWith('tax-1', {
        description: 'Updated VAT rate'
      });
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(mockUpdatedTax, 'updated');
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);

      await expect(taxService.updateTax('tax-1', {
        rates: [{
          id: 'rate-1',
          rate: -20, // Invalid negative rate
          type: TaxCalculationType.PERCENTAGE,
          effectiveFrom: new Date(),
          currency: SUPPORTED_CURRENCIES[0]
        }]
      }))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw error when tax update fails', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(taxService.updateTax('tax-1', {
        description: 'Updated VAT rate'
      }))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('deleteTax', () => {
    it('should delete a tax record successfully', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.delete.mockResolvedValue({
        id: 'tax-1',
        deleted: true,
        updatedAt: new Date()
      });

      const result = await taxService.deleteTax('tax-1');

      expect(result).toBe(true);
      expect(mockTaxRepository.delete).toHaveBeenCalledWith('tax-1');
      expect(mockNotificationService.sendTaxNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tax-1',
          deleted: true
        }),
        'deleted'
      );
    });

    it('should throw error when tax is not found', async () => {
      mockTaxRepository.findById.mockResolvedValue(null);

      await expect(taxService.deleteTax('non-existent'))
        .rejects
        .toThrow('Tax not found');
    });

    it('should throw error when tax deletion fails', async () => {
      mockTaxRepository.findById.mockResolvedValue(mockTax);
      mockTaxRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(taxService.deleteTax('tax-1'))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getTaxSummary', () => {
    it('should return tax summary for an organization', async () => {
      const mockTaxes = [mockTax];
      mockTaxRepository.find.mockResolvedValue(mockTaxes);

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      };

      const result = await taxService.getTaxSummary('org-1', dateRange);

      expect(result).toBeDefined();
      expect(mockTaxRepository.find).toHaveBeenCalledWith({
        organizationId: 'org-1',
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      });
    });
  });

  describe('calculateTax', () => {
    const mockTaxRates = [{
      id: 'rate-1',
      rate: 20,
      type: TaxCalculationType.PERCENTAGE,
      effectiveFrom: new Date(),
      currency: SUPPORTED_CURRENCIES[0]
    }];

    it('should calculate tax based on income and tax year', async () => {
      mockTaxRepository.getTaxRates.mockResolvedValue(mockTaxRates);

      const result = await taxService.calculateTax(1000, 2024);

      expect(result).toEqual({
        taxableAmount: 1000,
        taxAmount: 200,
        taxRate: 20
      });
      expect(mockTaxRepository.getTaxRates).toHaveBeenCalledWith(2024);
    });

    it('should throw error when no tax rates found', async () => {
      mockTaxRepository.getTaxRates.mockResolvedValue([]);

      await expect(taxService.calculateTax(1000, 2024))
        .rejects
        .toThrow('No tax rates found for the specified year');
    });

    it('should throw error when tax calculation fails', async () => {
      mockTaxRepository.getTaxRates.mockRejectedValue(new Error('Database error'));

      await expect(taxService.calculateTax(1000, 2024))
        .rejects
        .toThrow('Database error');
    });
  });
}); 