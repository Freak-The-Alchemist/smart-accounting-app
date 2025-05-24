import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserRole } from '../types/auth';

export class AuthService {
  private static instance: AuthService;
  private auth = getAuth();

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async createUserProfile(user: FirebaseUser, role: UserRole): Promise<void> {
    const userData: User = {
      id: user.uid,
      email: user.email!,
      role,
      displayName: user.displayName || user.email!.split('@')[0],
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userData);
  }

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    return userDoc.data() as User;
  }

  async signUp(email: string, password: string, role: UserRole): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUserProfile(userCredential.user, role);
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    return userDoc.data() as User;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });

    if (data.displayName || data.photoURL) {
      await firebaseUpdateProfile(this.auth.currentUser!, {
        displayName: data.displayName,
        photoURL: data.photoURL
      });
    }
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    return userDoc.data().role as UserRole;
  }

  async hasPermission(userId: string, requiredRole: UserRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    const roleHierarchy: Record<UserRole, number> = {
      'admin': 3,
      'accountant': 2,
      'attendant': 1
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
} 