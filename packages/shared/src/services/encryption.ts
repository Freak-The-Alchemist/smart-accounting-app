import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string;

  private constructor() {
    // In production, this should be stored securely and not hardcoded
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-secure-key';
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  public encrypt(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }

  public decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  public encryptSensitiveFields(data: any, fields: string[]): any {
    const encryptedData = { ...data };
    fields.forEach(field => {
      if (data[field]) {
        encryptedData[field] = this.encrypt(data[field]);
      }
    });
    return encryptedData;
  }

  public decryptSensitiveFields(data: any, fields: string[]): any {
    const decryptedData = { ...data };
    fields.forEach(field => {
      if (data[field]) {
        try {
          decryptedData[field] = this.decrypt(data[field]);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    });
    return decryptedData;
  }

  public hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  public verifyPassword(password: string, hashedPassword: string): boolean {
    const hashedInput = this.hashPassword(password);
    return hashedInput === hashedPassword;
  }
} 