import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { 
  getAuth, 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  MultiFactorError
} from 'firebase/auth';
import { encrypt, decrypt } from '../utils/encryption';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

export interface TwoFactorSetup {
  phoneNumber: string;
  verificationId: string;
  isEnabled: boolean;
}

export class SecurityService {
  private static instance: SecurityService;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  private constructor() {}

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Two-Factor Authentication
  async setupTwoFactor(phoneNumber: string): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to setup 2FA');
    }

    try {
      // Create a new phone multi factor info
      const multiFactorSession = await multiFactor(user).getSession();
      
      // Create a phone auth provider
      const phoneProvider = new PhoneAuthProvider(auth);
      
      // Initialize reCAPTCHA verifier
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            // reCAPTCHA solved
          },
        });
      }

      // Get verification ID
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        this.recaptchaVerifier
      );

      // Store 2FA setup in Firestore
      await this.storeTwoFactorSetup(user.uid, {
        phoneNumber,
        verificationId,
        isEnabled: false,
      });

      return verificationId;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  async verifyAndEnableTwoFactor(verificationCode: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to verify 2FA');
    }

    try {
      const credential = PhoneAuthProvider.credential(
        (await this.getTwoFactorSetup(user.uid)).verificationId,
        verificationCode
      );

      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);

      // Enroll the user with the phone multi factor
      await multiFactor(user).enroll(multiFactorAssertion, 'Phone 2FA');

      // Update 2FA status in Firestore
      await this.updateTwoFactorStatus(user.uid, true);
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  }

  private async storeTwoFactorSetup(userId: string, setup: TwoFactorSetup): Promise<void> {
    await addDoc(collection(db, 'twoFactorSetups'), {
      userId,
      ...setup,
      createdAt: serverTimestamp(),
    });
  }

  private async getTwoFactorSetup(userId: string): Promise<TwoFactorSetup> {
    const q = query(
      collection(db, 'twoFactorSetups'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('No 2FA setup found for user');
    }

    return snapshot.docs[0].data() as TwoFactorSetup;
  }

  private async updateTwoFactorStatus(userId: string, isEnabled: boolean): Promise<void> {
    const setup = await this.getTwoFactorSetup(userId);
    await addDoc(collection(db, 'twoFactorSetups'), {
      ...setup,
      isEnabled,
      updatedAt: serverTimestamp(),
    });
  }

  // Audit Trail
  async logAuditEvent(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const log: Omit<AuditLog, 'id'> = {
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      timestamp: serverTimestamp() as Timestamp,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
    };

    await addDoc(collection(db, 'auditLogs'), log);
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100
  ): Promise<AuditLog[]> {
    let q = query(collection(db, 'auditLogs'));

    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters.resourceType) {
      q = query(q, where('resourceType', '==', filters.resourceType));
    }
    if (filters.resourceId) {
      q = query(q, where('resourceId', '==', filters.resourceId));
    }
    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    q = query(q, orderBy('timestamp', 'desc'), limit(limit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditLog[];
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return 'unknown';
    }
  }

  // Data Encryption
  async encryptData(data: any, key: string): Promise<string> {
    return encrypt(JSON.stringify(data), key);
  }

  async decryptData(encryptedData: string, key: string): Promise<any> {
    const decrypted = decrypt(encryptedData, key);
    return JSON.parse(decrypted);
  }
}

export const securityService = SecurityService.getInstance(); 