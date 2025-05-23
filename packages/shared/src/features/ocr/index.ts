import { createWorker, Worker } from 'tesseract.js';

export const extractTextFromImage = async (imageUrl: string): Promise<string> => {
  const worker = await createWorker() as Worker;
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  const { data: { text } } = await worker.recognize(imageUrl);
  await worker.terminate();
  
  return text;
};

export const parseReceipt = async (imageUrl: string): Promise<{
  total: number;
  date: Date;
  items: Array<{ description: string; amount: number }>;
}> => {
  const text = await extractTextFromImage(imageUrl);
  // TODO: Implement receipt parsing logic
  return {
    total: 0,
    date: new Date(),
    items: [],
  };
}; 