import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { User } from '../types/User';
import { Transaction } from '@smart-accounting/shared/src/models/Transaction';

class FirebaseService {
  private static instance: FirebaseService;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userDoc = await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();
      
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await firestore().collection('users').doc(user.id).set(user);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Transaction methods
  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not authenticated');

      const transactionRef = firestore().collection('transactions').doc();
      const newTransaction: Transaction = {
        ...transaction,
        id: transactionRef.id,
        createdBy: user.uid,
        updatedBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await transactionRef.set(newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('Add transaction error:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('User not authenticated');

      const snapshot = await firestore()
        .collection('transactions')
        .where('createdBy', '==', user.uid)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Transaction);
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // File upload methods
  async uploadFile(uri: string, path: string): Promise<string> {
    try {
      const reference = storage().ref(path);
      await reference.putFile(uri);
      return await reference.getDownloadURL();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Real-time listeners
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get();
        
        callback({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          ...userDoc.data()
        } as User);
      } else {
        callback(null);
      }
    });
  }

  onTransactionsChange(callback: (transactions: Transaction[]) => void): () => void {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    return firestore()
      .collection('transactions')
      .where('createdBy', '==', user.uid)
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const transactions = snapshot.docs.map(doc => doc.data() as Transaction);
        callback(transactions);
      });
  }
}

export default FirebaseService; 