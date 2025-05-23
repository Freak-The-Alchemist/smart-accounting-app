import { GoogleCloudVision } from '@google-cloud/vision';

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

export class OCRService {
  private vision: GoogleCloudVision;

  constructor() {
    this.vision = new GoogleCloudVision({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  async processImage(imageBuffer: Buffer): Promise<OCRResult[]> {
    try {
      const [result] = await this.vision.documentTextDetection(imageBuffer);
      const detections = result.textAnnotations || [];

      return detections.map((detection) => ({
        text: detection.description || '',
        confidence: detection.confidence || 0,
        boundingBox: detection.boundingPoly
          ? {
              vertices: detection.boundingPoly.vertices.map((vertex) => ({
                x: vertex.x || 0,
                y: vertex.y || 0,
              })),
            }
          : undefined,
      }));
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  async extractReceiptData(imageBuffer: Buffer): Promise<{
    total: number;
    date: string;
    items: Array<{ description: string; amount: number }>;
  }> {
    const results = await this.processImage(imageBuffer);
    const text = results[0]?.text || '';

    // Extract total amount
    const totalMatch = text.match(/total:?\s*\$?(\d+\.\d{2})/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extract date
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract items (this is a simple implementation, might need refinement)
    const items: Array<{ description: string; amount: number }> = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const amountMatch = line.match(/\$?(\d+\.\d{2})$/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        const description = line.replace(/\$?\d+\.\d{2}$/, '').trim();
        if (description) {
          items.push({ description, amount });
        }
      }
    }

    return {
      total,
      date,
      items,
    };
  }
} 