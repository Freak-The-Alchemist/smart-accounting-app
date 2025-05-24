import { createWorker } from 'tesseract.js';

// Preprocessors for receipt images
const preprocessImage = async (imageFile: File | Blob): Promise<Blob> => {
  // Example: Use canvas to improve contrast (simplified)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = await createImageBitmap(imageFile);
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.filter = 'contrast(1.2) brightness(1.1)';
  ctx.drawImage(img, 0, 0);
  
  return await new Promise(resolve => canvas.toBlob(resolve as any, 'image/jpeg', 0.9));
};

export const scanReceipt = async (image: File | Blob): Promise<{ text: string; confidence: number }> => {
  const processedImage = await preprocessImage(image);
  const worker = await createWorker({
    logger: m => console.log(m), // Remove in production
  });
  
  try {
    await worker.loadLanguage('eng+swa');
    await worker.initialize('eng+swa');
    const { data } = await worker.recognize(processedImage);
    
    return {
      text: data.text,
      confidence: data.confidence
    };
  } finally {
    await worker.terminate();
  }
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