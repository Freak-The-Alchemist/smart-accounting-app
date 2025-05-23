import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { scanReceipt } from '../ocr';

export const processStorageReceipt = async (filePath: string) => {
  const storage = getStorage();
  const fileRef = ref(storage, filePath);
  
  try {
    const url = await getDownloadURL(fileRef);
    const response = await fetch(url);
    const blob = await response.blob();
    
    return await scanReceipt(blob);
  } catch (error) {
    console.error('OCR failed:', error);
    throw new Error('Receipt processing failed');
  }
}; 