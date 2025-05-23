import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key';

// AES Encryption
export function encrypt(data: string, key: string = ENCRYPTION_KEY): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedData: string, key: string = ENCRYPTION_KEY): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// RSA Encryption (for key exchange)
export function generateRSAKeyPair(): { publicKey: string; privateKey: string } {
  // This is a placeholder - in a real implementation, you would use a proper RSA library
  const publicKey = 'public-key-placeholder';
  const privateKey = 'private-key-placeholder';
  return { publicKey, privateKey };
}

// Triple DES Encryption
export function encryptTripleDES(data: string, key: string): string {
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.TripleDES.encrypt(data, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    console.error('Triple DES encryption error:', error);
    throw new Error('Failed to encrypt data with Triple DES');
  }
}

export function decryptTripleDES(encryptedData: string, key: string): string {
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.TripleDES.decrypt(encryptedData, keyHex, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Triple DES decryption error:', error);
    throw new Error('Failed to decrypt data with Triple DES');
  }
}

// Blowfish Encryption
export function encryptBlowfish(data: string, key: string): string {
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const encrypted = CryptoJS.Blowfish.encrypt(data, keyHex, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    console.error('Blowfish encryption error:', error);
    throw new Error('Failed to encrypt data with Blowfish');
  }
}

export function decryptBlowfish(encryptedData: string, key: string): string {
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.Blowfish.decrypt(encryptedData, keyHex, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Blowfish decryption error:', error);
    throw new Error('Failed to decrypt data with Blowfish');
  }
}

// Key Management
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

export function deriveKeyFromPassword(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashedInput = CryptoJS.SHA256(password).toString();
  return hashedInput === hashedPassword;
}

// Secure Key Storage
export function encryptKey(key: string, masterKey: string): string {
  return encrypt(key, masterKey);
}

export function decryptKey(encryptedKey: string, masterKey: string): string {
  return decrypt(encryptedKey, masterKey);
}

// Data Integrity
export function generateHMAC(data: string, key: string): string {
  return CryptoJS.HmacSHA256(data, key).toString();
}

export function verifyHMAC(data: string, hmac: string, key: string): boolean {
  const calculatedHmac = generateHMAC(data, key);
  return calculatedHmac === hmac;
}

// Secure Data Storage
export function secureStore(data: any, key: string): string {
  const jsonData = JSON.stringify(data);
  const encrypted = encrypt(jsonData, key);
  const hmac = generateHMAC(jsonData, key);
  return JSON.stringify({ data: encrypted, hmac });
}

export function secureRetrieve(secureData: string, key: string): any {
  const { data: encrypted, hmac } = JSON.parse(secureData);
  const decrypted = decrypt(encrypted, key);
  
  if (!verifyHMAC(decrypted, hmac, key)) {
    throw new Error('Data integrity check failed');
  }
  
  return JSON.parse(decrypted);
} 