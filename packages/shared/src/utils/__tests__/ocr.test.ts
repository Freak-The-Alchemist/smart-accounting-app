import { OCRService } from '../ocr';
import { GoogleCloudVision } from '@google-cloud/vision';

// Mock Google Cloud Vision
jest.mock('@google-cloud/vision');

describe('OCRService', () => {
  let ocrService: OCRService;
  let mockVision: jest.Mocked<GoogleCloudVision>;

  beforeEach(() => {
    mockVision = {
      documentTextDetection: jest.fn(),
    } as any;
    (GoogleCloudVision as jest.Mock).mockImplementation(() => mockVision);
    ocrService = new OCRService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processImage', () => {
    it('should process image and return OCR results', async () => {
      const mockResult = {
        textAnnotations: [
          {
            description: 'Test Receipt\nTotal: $123.45\nDate: 01/01/2024',
            confidence: 0.95,
            boundingPoly: {
              vertices: [
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
                { x: 0, y: 100 },
              ],
            },
          },
        ],
      };

      mockVision.documentTextDetection.mockResolvedValue([mockResult]);

      const imageBuffer = Buffer.from('test image');
      const results = await ocrService.processImage(imageBuffer);

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Test Receipt\nTotal: $123.45\nDate: 01/01/2024');
      expect(results[0].confidence).toBe(0.95);
      expect(results[0].boundingBox).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockVision.documentTextDetection.mockRejectedValue(new Error('OCR failed'));

      const imageBuffer = Buffer.from('test image');
      await expect(ocrService.processImage(imageBuffer)).rejects.toThrow('Failed to process image with OCR');
    });
  });

  describe('extractReceiptData', () => {
    it('should extract receipt data correctly', async () => {
      const mockResult = {
        textAnnotations: [
          {
            description: 'Test Store\nItem 1: $10.00\nItem 2: $20.00\nTotal: $30.00\nDate: 01/01/2024',
            confidence: 0.95,
          },
        ],
      };

      mockVision.documentTextDetection.mockResolvedValue([mockResult]);

      const imageBuffer = Buffer.from('test image');
      const receiptData = await ocrService.extractReceiptData(imageBuffer);

      expect(receiptData).toEqual({
        total: 30.00,
        date: '01/01/2024',
        items: [
          { description: 'Item 1', amount: 10.00 },
          { description: 'Item 2', amount: 20.00 },
        ],
      });
    });

    it('should handle missing data gracefully', async () => {
      const mockResult = {
        textAnnotations: [
          {
            description: 'Invalid Receipt',
            confidence: 0.95,
          },
        ],
      };

      mockVision.documentTextDetection.mockResolvedValue([mockResult]);

      const imageBuffer = Buffer.from('test image');
      const receiptData = await ocrService.extractReceiptData(imageBuffer);

      expect(receiptData).toEqual({
        total: 0,
        date: '',
        items: [],
      });
    });
  });
}); 