import { scanOCR, OCRFrame } from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';

export const scanReceipt = async (imageUri: string): Promise<string> => {
  // 1. Preprocess image (Expo)
  const { uri: processedUri } = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ contrast: 1.2 }, { brightness: 1.1 }],
    { compress: 0.8, format: 'jpeg' }
  );

  // 2. Scan with ML Kit
  const result: OCRFrame = await scanOCR(processedUri);
  
  // 3. Extract relevant text blocks
  return result.blocks
    .filter(block => block.confidence > 0.7) // Only high-confidence
    .map(block => block.text)
    .join('\n');
};

// Receipt-specific data extraction
const RECEIPT_KEYWORDS = ['TOTAL', 'AMOUNT', 'DATE', 'LITERS', 'VAT'];

export const extractReceiptData = (text: string) => {
  const lines = text.split('\n');
  return {
    total: lines.find(line => line.match(/(TOTAL|AMOUNT)\s*[\$\£]?\d+\.\d{2}/i)),
    date: lines.find(line => line.match(/\d{2}\/\d{2}\/\d{4}/)),
    vendor: lines[0] // First line usually has vendor name
  };
}; 