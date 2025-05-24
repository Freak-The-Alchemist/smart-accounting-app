import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  updatePassword,
  updateEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { EncryptionService } from './encryption';
import { auth } from '../config/firebase';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  phoneNumber?: string;
  emailVerified: boolean;
  lastLogin?: Date;
  lastActive?: Date;
  status: 'active' | 'inactive';
}

interface LoginAttempt {
  timestamp: number;
  count: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDuration: number;
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
};

export interface AuthError {
  code: string;
  message: string;
}

export const login = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw {
      code: (error as AuthError).code,
      message: (error as AuthError).message
    };
  }
};

export const register = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw {
      code: (error as AuthError).code,
      message: (error as AuthError).message
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw {
      code: (error as AuthError).code,
      message: (error as AuthError).message
    };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export class AuthService {
  private static instance: AuthService;
  private auth = getAuth();
  private db = getFirestore();
  private encryption = EncryptionService.getInstance();
  private loginAttempts: Map<string, LoginAttempt> = new Map();

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(email: string, password: string): Promise<AuthUser> {
    try {
      // Check rate limiting
      const attempt = this.loginAttempts.get(email) || { timestamp: Date.now(), count: 0 };
      const now = Date.now();

      // Reset count if window has passed
      if (now - attempt.timestamp > RATE_LIMIT_CONFIG.windowMs) {
        attempt.count = 0;
        attempt.timestamp = now;
      }

      // Check if user is locked out
      if (attempt.count >= RATE_LIMIT_CONFIG.maxAttempts) {
        const lockoutTime = attempt.timestamp + RATE_LIMIT_CONFIG.lockoutDuration;
        if (now < lockoutTime) {
          const remainingTime = Math.ceil((lockoutTime - now) / 60000);
          throw new Error(`Account temporarily locked. Please try again in ${remainingTime} minutes.`);
        } else {
          // Reset attempt count if lockout period has passed
          attempt.count = 0;
          attempt.timestamp = now;
        }
      }

      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Reset attempt count on successful login
      this.loginAttempts.delete(email);

      // Check if this is a new device
      const isNewDevice = await this.isNewDevice(user);
      if (isNewDevice) {
        await this.sendVerificationCode(user);
        throw new Error('Please verify your device with the code sent to your email');
      }

      // Update last login
      await this.updateUserLastLogin(user.uid);

      return this.getUserData(user);
    } catch (error) {
      // Increment attempt count on failed login
      const attempt = this.loginAttempts.get(email) || { timestamp: Date.now(), count: 0 };
      attempt.count++;
      this.loginAttempts.set(email, attempt);

      throw error;
    }
  }

  private async isNewDevice(user: User): Promise<boolean> {
    const userDoc = await getDoc(doc(this.db, 'users', user.uid));
    if (!userDoc.exists()) return true;

    const userData = userDoc.data();
    const knownDevices = userData.knownDevices || [];
    const currentDevice = await this.getDeviceIdentifier();

    return !knownDevices.includes(currentDevice);
  }

  private async getDeviceIdentifier(): Promise<string> {
    // Generate a unique device identifier based on browser/device characteristics
    const userAgent = navigator.userAgent;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return this.encryption.hashPassword(`${userAgent}-${screenResolution}-${timeZone}`);
  }

  private async sendVerificationCode(user: User): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

    await setDoc(doc(this.db, 'verificationCodes', user.uid), {
      code,
      expiry: codeExpiry,
      deviceId: await this.getDeviceIdentifier()
    });

    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-device?code=${code}`
    });
  }

  public async verifyDevice(code: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user logged in');

    const codeDoc = await getDoc(doc(this.db, 'verificationCodes', user.uid));
    if (!codeDoc.exists()) throw new Error('Invalid verification code');

    const { code: storedCode, expiry, deviceId } = codeDoc.data();
    if (code !== storedCode) throw new Error('Invalid verification code');
    if (new Date() > expiry.toDate()) throw new Error('Verification code expired');

    // Add device to known devices
    const userRef = doc(this.db, 'users', user.uid);
    await updateDoc(userRef, {
      knownDevices: [...(await this.getKnownDevices(user.uid)), deviceId]
    });

    // Delete used code
    await setDoc(doc(this.db, 'verificationCodes', user.uid), {});
  }

  private async getKnownDevices(userId: string): Promise<string[]> {
    const userDoc = await getDoc(doc(this.db, 'users', userId));
    return userDoc.data()?.knownDevices || [];
  }

  public async register(email: string, password: string, userData: Partial<AuthUser>): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Create user document with encrypted sensitive data
      const encryptedData = this.encryption.encryptSensitiveFields(userData, ['phoneNumber']);
      await setDoc(doc(this.db, 'users', user.uid), {
        ...encryptedData,
        uid: user.uid,
        email,
        emailVerified: false,
        status: 'active',
        knownDevices: [await this.getDeviceIdentifier()],
        createdAt: new Date()
      });

      // Send email verification
      await sendEmailVerification(user);

      return this.getUserData(user);
    } catch (error) {
      throw error;
    }
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw error;
    }
  }

  public async updateUserProfile(userId: string, data: Partial<AuthUser>): Promise<void> {
    const userRef = doc(this.db, 'users', userId);
    const encryptedData = this.encryption.encryptSensitiveFields(data, ['phoneNumber']);
    await updateDoc(userRef, encryptedData);
  }

  private async updateUserLastLogin(userId: string): Promise<void> {
    const userRef = doc(this.db, 'users', userId);
    await updateDoc(userRef, {
      lastLogin: new Date(),
      lastActive: new Date(),
      status: 'active'
    });
  }

  private async getUserData(user: User): Promise<AuthUser> {
    const userDoc = await getDoc(doc(this.db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User data not found');

    const userData = userDoc.data();
    const decryptedData = this.encryption.decryptSensitiveFields(userData, ['phoneNumber']);

    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || '',
      role: decryptedData.role,
      phoneNumber: decryptedData.phoneNumber,
      emailVerified: user.emailVerified,
      lastLogin: decryptedData.lastLogin?.toDate(),
      lastActive: decryptedData.lastActive?.toDate(),
      status: decryptedData.status
    };
  }

  public async logout(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const userRef = doc(this.db, 'users', user.uid);
      await updateDoc(userRef, {
        lastActive: new Date(),
        status: 'inactive'
      });
    }
    await signOut(this.auth);
  }
} 