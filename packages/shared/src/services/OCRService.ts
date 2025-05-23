import { createWorker } from 'tesseract.js';
import { Currency } from '../models/Currency';
import { TransactionType } from '../models/Transaction';
import { CurrencyService } from './CurrencyService';
import { storage } from '../firebase/config';
import { Transaction } from '../models/Transaction';
import { Invoice } from '../models/Invoice';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { GoogleCloudVision } from '@react-native-google-cloud-vision/google-cloud-vision';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExtractedData {
  type: 'invoice' | 'receipt' | 'bank_statement';
  date?: Date;
  amount?: number;
  currency?: Currency;
  vendor?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  tax?: number;
  total?: number;
  confidence: number;
  rawText: string;
}

export interface ReceiptData {
  vendor: string;
  date: Date;
  total: number;
  items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  taxAmount?: number;
  taxRate?: number;
  currency: string;
  rawText: string;
}

export class OCRService {
  private static instance: OCRService;
  private currencyService: CurrencyService;
  private readonly SUPPORTED_LANGUAGES = ['eng', 'swa'];
  private readonly MERCHANT_PATTERNS = [
    /merchant:\s*(.+)/i,
    /vendor:\s*(.+)/i,
    /store:\s*(.+)/i,
    /business:\s*(.+)/i,
    /company:\s*(.+)/i,
    /supplier:\s*(.+)/i,
    /mwenye biashara:\s*(.+)/i,
    /muuzaji:\s*(.+)/i,
    /duka:\s*(.+)/i,
    /biashara:\s*(.+)/i,
    /kampuni:\s*(.+)/i,
    /wasambazaji:\s*(.+)/i
  ];
  private readonly DATE_PATTERNS = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /date:\s*(\d{1,2}-\d{1,2}-\d{2,4})/i,
    /date:\s*(\d{4}-\d{2}-\d{2})/i,
    /tarehe:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /tarehe:\s*(\d{1,2}-\d{1,2}-\d{2,4})/i,
    /tarehe:\s*(\d{4}-\d{2}-\d{2})/i
  ];
  private readonly AMOUNT_PATTERNS = [
    /total:\s*([\d,]+\.?\d*)/i,
    /amount:\s*([\d,]+\.?\d*)/i,
    /sum:\s*([\d,]+\.?\d*)/i,
    /balance:\s*([\d,]+\.?\d*)/i,
    /due:\s*([\d,]+\.?\d*)/i,
    /payment:\s*([\d,]+\.?\d*)/i,
    /jumla:\s*([\d,]+\.?\d*)/i,
    /kiasi:\s*([\d,]+\.?\d*)/i,
    /jumla ya:\s*([\d,]+\.?\d*)/i,
    /salio:\s*([\d,]+\.?\d*)/i,
    /deni:\s*([\d,]+\.?\d*)/i,
    /malipo:\s*([\d,]+\.?\d*)/i
  ];
  private readonly TAX_PATTERNS = [
    /tax:\s*([\d,]+\.?\d*)/i,
    /vat:\s*([\d,]+\.?\d*)/i,
    /gst:\s*([\d,]+\.?\d*)/i,
    /sales tax:\s*([\d,]+\.?\d*)/i,
    /kodi:\s*([\d,]+\.?\d*)/i,
    /ushuru:\s*([\d,]+\.?\d*)/i,
    /kodi ya mauzo:\s*([\d,]+\.?\d*)/i
  ];
  private readonly INVOICE_PATTERNS = [
    /invoice\s*(?:#|number)?:?\s*([A-Z0-9-]+)/i,
    /receipt\s*(?:#|number)?:?\s*([A-Z0-9-]+)/i,
    /order\s*(?:#|number)?:?\s*([A-Z0-9-]+)/i,
    /ankara\s*(?:#|namba)?:?\s*([A-Z0-9-]+)/i,
    /risiti\s*(?:#|namba)?:?\s*([A-Z0-9-]+)/i,
    /agizo\s*(?:#|namba)?:?\s*([A-Z0-9-]+)/i
  ];
  private readonly vision: GoogleCloudVision;

  private constructor() {
    this.currencyService = CurrencyService.getInstance();
    this.vision = new GoogleCloudVision({
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
    });
  }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async processImage(
    imageData: Buffer | string,
    options: {
      language?: string;
      currency?: Currency;
      expectedType?: TransactionType;
      documentType?: 'receipt' | 'invoice' | 'statement';
    } = {}
  ): Promise<OCRResult> {
    const {
      language = 'eng',
      currency = 'KES',
      expectedType = 'expense',
      documentType = 'receipt'
    } = options;

    // Initialize Tesseract worker
    const worker = await createWorker();
    await worker.load();
    await (worker as any).loadLanguage(language);
    await (worker as any).initialize(language);

    try {
      // Process image
      const result = await worker.recognize(imageData);
      const extractedData = this.extractData(result.data.text, currency, documentType);

      // Validate extracted data
      const validation = await this.validateExtractedData(extractedData);
      if (!validation.isValid) {
        console.warn('Validation warnings:', validation.warnings);
      }

      // Suggest category based on extracted data
      const categorySuggestion = await this.suggestCategory(extractedData);
      if (categorySuggestion.confidence > 0.7) {
        extractedData.suggestedCategory = categorySuggestion.category;
      }

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        extractedData,
        rawData: {
          lines: result.data.lines.map(line => line.text),
          words: result.data.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          }))
        }
      };
    } finally {
      await worker.terminate();
    }
  }

  private extractData(
    text: string,
    currency: Currency,
    documentType: 'receipt' | 'invoice' | 'statement'
  ): OCRResult['extractedData'] {
    const extractedData: OCRResult['extractedData'] = {};

    // Extract document number
    for (const pattern of this.INVOICE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        extractedData.documentNumber = match[1].trim();
        break;
      }
    }

    // Extract merchant name
    for (const pattern of this.MERCHANT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        extractedData.merchant = match[1].trim();
        break;
      }
    }

    // Extract date
    for (const pattern of this.DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[1];
        extractedData.date = this.parseDate(dateStr);
        break;
      }
    }

    // Extract amounts
    for (const pattern of this.AMOUNT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        extractedData.totalAmount = parseFloat(amountStr);
        break;
      }
    }

    // Extract tax amount
    for (const pattern of this.TAX_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const taxStr = match[1].replace(/,/g, '');
        extractedData.taxAmount = parseFloat(taxStr);
        break;
      }
    }

    // Extract line items with amounts
    extractedData.items = this.extractLineItems(text);

    // Extract payment method if present
    const paymentMatch = text.match(/payment method:\s*(.+)/i);
    if (paymentMatch) {
      extractedData.paymentMethod = paymentMatch[1].trim();
    }

    // Extract customer/client information for invoices
    if (documentType === 'invoice') {
      const customerMatch = text.match(/customer:\s*(.+)/i) || text.match(/client:\s*(.+)/i);
      if (customerMatch) {
        extractedData.customer = customerMatch[1].trim();
      }
    }

    return extractedData;
  }

  private parseDate(dateStr: string): Date {
    // Handle different date formats
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      const yearNum = year.length === 2 ? Number(`20${year}`) : Number(year);
      return new Date(yearNum, parseInt(month) - 1, parseInt(day));
    } else if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    return new Date();
  }

  private extractLineItems(text: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let isItemSection = false;

    for (const line of lines) {
      // Look for item section markers
      if (line.match(/items?:/i) || line.match(/description:/i)) {
        isItemSection = true;
        continue;
      }

      // End of items section
      if (isItemSection && line.match(/total:/i)) {
        break;
      }

      // Extract items
      if (isItemSection && line.trim()) {
        const itemMatch = line.match(/^(.+?)\s+[\d,]+\.?\d*$/);
        if (itemMatch) {
          items.push(itemMatch[1].trim());
        }
      }
    }

    return items;
  }

  async validateExtractedData(
    data: OCRResult['extractedData']
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.date) {
      errors.push('Date not found in document');
    } else {
      // Validate date is not in the future
      if (data.date > new Date()) {
        errors.push('Date cannot be in the future');
      }
    }

    if (!data.totalAmount) {
      errors.push('Total amount not found in document');
    } else {
      // Validate amount is positive
      if (data.totalAmount <= 0) {
        errors.push('Total amount must be positive');
      }
    }

    if (!data.merchant) {
      errors.push('Merchant name not found in document');
    }

    // Tax validation
    if (data.taxAmount) {
      // Validate tax amount is not greater than total
      if (data.taxAmount > data.totalAmount!) {
        warnings.push('Tax amount appears to be greater than total amount');
      }

      // Validate tax rate is reasonable (e.g., not more than 30%)
      const taxRate = (data.taxAmount / data.totalAmount!) * 100;
      if (taxRate > 30) {
        warnings.push('Tax rate appears unusually high');
      }
    }

    // Line items validation
    if (data.items && data.items.length > 0) {
      // Check for duplicate items
      const uniqueItems = new Set(data.items);
      if (uniqueItems.size !== data.items.length) {
        warnings.push('Duplicate items detected in the document');
      }

      // Validate item descriptions
      data.items.forEach((item, index) => {
        if (item.length < 2) {
          warnings.push(`Item ${index + 1} description is too short`);
        }
      });
    }

    // Document number validation
    if (data.documentNumber) {
      // Check for common patterns in document numbers
      if (!/^[A-Z0-9-]+$/.test(data.documentNumber)) {
        warnings.push('Document number format appears unusual');
      }
    }

    // Payment method validation
    if (data.paymentMethod) {
      const validPaymentMethods = ['cash', 'credit card', 'debit card', 'bank transfer', 'check'];
      if (!validPaymentMethods.some(method => 
        data.paymentMethod!.toLowerCase().includes(method)
      )) {
        warnings.push('Unrecognized payment method');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async suggestCategory(
    extractedData: OCRResult['extractedData']
  ): Promise<{ category: string; confidence: number }> {
    const categories: { [key: string]: { keywords: string[]; swahiliKeywords: string[]; confidence: number } } = {
      'Office Supplies': {
        keywords: ['paper', 'pen', 'pencil', 'folder', 'stapler', 'printer', 'ink', 'toner'],
        swahiliKeywords: ['karatasi', 'kalamu', 'penseli', 'folda', 'stapler', 'printer', 'wino', 'toner'],
        confidence: 0.8
      },
      'Travel': {
        keywords: ['hotel', 'flight', 'taxi', 'uber', 'lyft', 'transport', 'travel'],
        swahiliKeywords: ['hoteli', 'ndege', 'teksi', 'uber', 'lyft', 'usafiri', 'safari'],
        confidence: 0.9
      },
      'Meals': {
        keywords: ['restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast'],
        swahiliKeywords: ['restaurant', 'kahawa', 'kifungua kinywa', 'chakula cha mchana', 'chakula cha jioni', 'kifungua kinywa'],
        confidence: 0.85
      },
      'Utilities': {
        keywords: ['electricity', 'water', 'gas', 'internet', 'phone', 'utility'],
        swahiliKeywords: ['umeme', 'maji', 'gesi', 'intaneti', 'simu', 'huduma'],
        confidence: 0.9
      },
      'Professional Services': {
        keywords: ['consulting', 'legal', 'accounting', 'service', 'professional'],
        swahiliKeywords: ['ushauri', 'kisheria', 'uhasibu', 'huduma', 'taaluma'],
        confidence: 0.8
      }
    };

    let bestMatch = { category: 'Uncategorized', confidence: 0 };
    const text = [
      extractedData.merchant,
      ...(extractedData.items || []),
      extractedData.paymentMethod
    ].filter(Boolean).join(' ').toLowerCase();

    for (const [category, { keywords, swahiliKeywords, confidence }] of Object.entries(categories)) {
      const allKeywords = [...keywords, ...swahiliKeywords];
      const matchCount = allKeywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount > 0) {
        const matchConfidence = (matchCount / allKeywords.length) * confidence;
        if (matchConfidence > bestMatch.confidence) {
          bestMatch = { category, confidence: matchConfidence };
        }
      }
    }

    return bestMatch;
  }

  async scanDocument(file: File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(this.API_URL!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error scanning document:', error);
      throw error;
    }
  }

  async extractData(ocrResult: OCRResult): Promise<ExtractedData> {
    const text = ocrResult.text.toLowerCase();
    const extractedData: ExtractedData = {
      type: this.detectDocumentType(text),
      confidence: ocrResult.confidence,
      rawText: ocrResult.text,
    };

    // Extract date
    const dateMatch = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
    if (dateMatch) {
      extractedData.date = new Date(dateMatch[0]);
    }

    // Extract amount and currency
    const amountMatch = text.match(/(\d+(?:[.,]\d{2})?)\s*([A-Z]{3})/);
    if (amountMatch) {
      extractedData.amount = parseFloat(amountMatch[1].replace(',', '.'));
      extractedData.currency = amountMatch[2] as Currency;
    }

    // Extract vendor
    const vendorMatch = text.match(/(?:vendor|seller|from|issued by):\s*([^\n]+)/i);
    if (vendorMatch) {
      extractedData.vendor = vendorMatch[1].trim();
    }

    // Extract items for invoices
    if (extractedData.type === 'invoice') {
      extractedData.items = this.extractItems(ocrResult);
    }

    // Extract tax
    const taxMatch = text.match(/(?:tax|vat):\s*(\d+(?:[.,]\d{2})?)/i);
    if (taxMatch) {
      extractedData.tax = parseFloat(taxMatch[1].replace(',', '.'));
    }

    // Extract total
    const totalMatch = text.match(/(?:total|amount|sum):\s*(\d+(?:[.,]\d{2})?)/i);
    if (totalMatch) {
      extractedData.total = parseFloat(totalMatch[1].replace(',', '.'));
    }

    return extractedData;
  }

  private detectDocumentType(text: string): ExtractedData['type'] {
    if (text.includes('invoice') || text.includes('bill')) {
      return 'invoice';
    } else if (text.includes('receipt')) {
      return 'receipt';
    } else if (text.includes('statement') || text.includes('account')) {
      return 'bank_statement';
    }
    return 'receipt'; // Default to receipt if type cannot be determined
  }

  private extractItems(ocrResult: OCRResult): ExtractedData['items'] {
    const items: ExtractedData['items'] = [];
    const lines = ocrResult.text.split('\n');

    let currentItem: any = null;
    for (const line of lines) {
      // Look for item descriptions
      if (line.match(/^[A-Za-z]/) && !line.match(/^(total|tax|subtotal|amount)/i)) {
        if (currentItem) {
          items.push(currentItem);
        }
        currentItem = {
          description: line.trim(),
          quantity: 1,
          unitPrice: 0,
          total: 0,
        };
      }

      // Look for quantities
      const quantityMatch = line.match(/(\d+)\s*x/i);
      if (quantityMatch && currentItem) {
        currentItem.quantity = parseInt(quantityMatch[1]);
      }

      // Look for prices
      const priceMatch = line.match(/(\d+(?:[.,]\d{2})?)/);
      if (priceMatch && currentItem) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        if (!currentItem.unitPrice) {
          currentItem.unitPrice = price;
        } else {
          currentItem.total = price;
        }
      }
    }

    // Add the last item
    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }

  async createTransactionFromOCR(extractedData: ExtractedData): Promise<Transaction> {
    if (!extractedData.amount || !extractedData.currency) {
      throw new Error('Amount and currency are required to create a transaction');
    }

    return {
      id: '', // Will be set by the service
      type: 'expense',
      amount: extractedData.amount,
      currency: extractedData.currency,
      description: extractedData.vendor || 'OCR Import',
      date: extractedData.date || new Date(),
      category: {
        id: '', // Will be set by the service
        name: 'OCR Import',
        type: 'expense',
      },
      status: 'completed',
      createdBy: '', // Will be set by the service
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ocrConfidence: extractedData.confidence,
        documentType: extractedData.type,
        rawText: extractedData.rawText,
      },
    };
  }

  async createInvoiceFromOCR(extractedData: ExtractedData): Promise<Invoice> {
    if (!extractedData.amount || !extractedData.currency || !extractedData.vendor) {
      throw new Error('Amount, currency, and vendor are required to create an invoice');
    }

    return {
      id: '', // Will be set by the service
      number: '', // Will be set by the service
      client: {
        name: extractedData.vendor,
        email: '',
        address: {
          street: '',
          city: '',
          country: '',
        },
      },
      items: extractedData.items || [{
        id: '', // Will be set by the service
        description: 'OCR Import',
        quantity: 1,
        unitPrice: extractedData.amount,
        tax: extractedData.tax || 0,
        total: extractedData.total || extractedData.amount,
      }],
      subtotal: extractedData.amount,
      tax: extractedData.tax || 0,
      total: extractedData.total || extractedData.amount,
      currency: extractedData.currency,
      issueDate: extractedData.date || new Date(),
      dueDate: new Date(extractedData.date || new Date().setDate(new Date().getDate() + 30)),
      status: 'draft',
      paymentTerms: '30 days',
      createdBy: '', // Will be set by the service
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ocrConfidence: extractedData.confidence,
        documentType: extractedData.type,
        rawText: extractedData.rawText,
      },
    };
  }

  async pickImage(): Promise<string> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      base64: true
    });

    if (result.canceled) {
      throw new Error('Image capture canceled');
    }

    return result.assets[0].uri;
  }

  async extractText(imageUri: string): Promise<OCRResult[]> {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Call Google Cloud Vision API
      const response = await this.vision.documentTextDetection({
        image: {
          content: base64
        }
      });

      // Process and return results
      return response.textAnnotations.map(annotation => ({
        text: annotation.description,
        confidence: annotation.confidence,
        boundingBox: annotation.boundingPoly?.vertices && {
          x: annotation.boundingPoly.vertices[0].x,
          y: annotation.boundingPoly.vertices[0].y,
          width: annotation.boundingPoly.vertices[1].x - annotation.boundingPoly.vertices[0].x,
          height: annotation.boundingPoly.vertices[2].y - annotation.boundingPoly.vertices[0].y
        }
      }));
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async parseReceipt(imageUri: string): Promise<ReceiptData> {
    const ocrResults = await this.extractText(imageUri);
    const rawText = ocrResults.map(r => r.text).join('\n');

    // Basic receipt parsing logic
    // This is a simplified version - you might want to enhance this based on your needs
    const lines = rawText.split('\n');
    
    // Extract vendor name (usually first line)
    const vendor = lines[0]?.trim() || 'Unknown Vendor';

    // Extract date (look for common date patterns)
    const dateMatch = rawText.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
    const date = dateMatch ? new Date(dateMatch[0]) : new Date();

    // Extract total amount (look for common total patterns)
    const totalMatch = rawText.match(/total:?\s*[$€£]?\s*(\d+\.?\d*)/i);
    const total = totalMatch ? parseFloat(totalMatch[1]) : 0;

    // Extract items (simplified version)
    const items = lines
      .filter(line => {
        const amountMatch = line.match(/\d+\.?\d*/);
        return amountMatch && !line.toLowerCase().includes('total');
      })
      .map(line => {
        const amountMatch = line.match(/\d+\.?\d*/);
        return {
          description: line.replace(/\d+\.?\d*/, '').trim(),
          amount: amountMatch ? parseFloat(amountMatch[0]) : 0
        };
      });

    // Extract tax information
    const taxMatch = rawText.match(/tax:?\s*[$€£]?\s*(\d+\.?\d*)/i);
    const taxAmount = taxMatch ? parseFloat(taxMatch[1]) : 0;

    // Determine currency (simplified version)
    const currencyMatch = rawText.match(/[$€£]/);
    const currency = currencyMatch ? currencyMatch[0] : 'KES';

    return {
      vendor,
      date,
      total,
      items,
      taxAmount,
      currency,
      rawText
    };
  }
} 