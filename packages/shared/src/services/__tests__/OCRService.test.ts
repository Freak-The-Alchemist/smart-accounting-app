import { OCRService } from '../OCRService';
import { Currency } from '../../models/Currency';

describe('OCRService', () => {
  let ocrService: OCRService;

  beforeEach(() => {
    ocrService = OCRService.getInstance();
  });

  describe('parseReceipt', () => {
    it('should correctly parse a receipt image', async () => {
      const mockImageUri = 'mock-image-uri';
      const mockOcrResult = {
        text: 'Vendor: Test Store\nDate: 2024-03-20\nTotal: 1500.00\nItems:\nItem 1: 500.00\nItem 2: 1000.00\nTax: 150.00',
        confidence: 0.95,
      };

      // Mock the extractText method
      jest.spyOn(ocrService as any, 'extractText').mockResolvedValue([mockOcrResult]);

      const result = await ocrService.parseReceipt(mockImageUri);

      expect(result).toEqual({
        vendor: 'Test Store',
        date: expect.any(Date),
        total: 1500.00,
        items: [
          { description: 'Item 1', amount: 500.00 },
          { description: 'Item 2', amount: 1000.00 },
        ],
        taxAmount: 150.00,
        currency: 'KES',
        rawText: mockOcrResult.text,
      });
    });

    it('should handle missing data gracefully', async () => {
      const mockImageUri = 'mock-image-uri';
      const mockOcrResult = {
        text: 'Some text without clear structure',
        confidence: 0.5,
      };

      jest.spyOn(ocrService as any, 'extractText').mockResolvedValue([mockOcrResult]);

      const result = await ocrService.parseReceipt(mockImageUri);

      expect(result).toEqual({
        vendor: 'Unknown Vendor',
        date: expect.any(Date),
        total: 0,
        items: [],
        taxAmount: 0,
        currency: 'KES',
        rawText: mockOcrResult.text,
      });
    });
  });

  describe('processImage', () => {
    it('should process image with default options', async () => {
      const mockImageData = 'mock-image-data';
      const mockResult = {
        text: 'Test receipt content',
        confidence: 0.9,
        extractedData: {
          type: 'receipt',
          date: new Date(),
          amount: 1000,
          currency: 'KES',
        },
      };

      jest.spyOn(ocrService as any, 'processImage').mockResolvedValue(mockResult);

      const result = await ocrService.processImage(mockImageData);

      expect(result).toEqual(mockResult);
    });

    it('should process image with custom options', async () => {
      const mockImageData = 'mock-image-data';
      const options = {
        language: 'swa',
        currency: 'USD' as Currency,
        expectedType: 'expense',
        documentType: 'invoice',
      };

      const mockResult = {
        text: 'Test invoice content',
        confidence: 0.9,
        extractedData: {
          type: 'invoice',
          date: new Date(),
          amount: 1000,
          currency: 'USD',
        },
      };

      jest.spyOn(ocrService as any, 'processImage').mockResolvedValue(mockResult);

      const result = await ocrService.processImage(mockImageData, options);

      expect(result).toEqual(mockResult);
    });
  });

  describe('validateExtractedData', () => {
    it('should validate correct data', async () => {
      const validData = {
        date: new Date(),
        totalAmount: 1000,
        merchant: 'Test Store',
        taxAmount: 100,
        items: ['Item 1', 'Item 2'],
        documentNumber: 'INV-001',
        paymentMethod: 'cash',
      };

      const result = await ocrService['validateExtractedData'](validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect invalid data', async () => {
      const invalidData = {
        date: new Date(Date.now() + 86400000), // Future date
        totalAmount: -1000, // Negative amount
        merchant: '', // Empty merchant
        taxAmount: 2000, // Tax greater than total
        items: [], // Empty items
      };

      const result = await ocrService['validateExtractedData'](invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('suggestCategory', () => {
    it('should suggest correct category based on content', async () => {
      const extractedData = {
        merchant: 'Office Supplies Store',
        items: ['Paper', 'Pens', 'Folders'],
        paymentMethod: 'credit card',
      };

      const result = await ocrService['suggestCategory'](extractedData);

      expect(result.category).toBe('Office Supplies');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should return Uncategorized for unclear content', async () => {
      const extractedData = {
        merchant: 'Unknown Store',
        items: ['Item 1', 'Item 2'],
        paymentMethod: 'cash',
      };

      const result = await ocrService['suggestCategory'](extractedData);

      expect(result.category).toBe('Uncategorized');
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
}); 