import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Transaction {
  id?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'transactions';

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transaction,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Failed to add transaction');
  }
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...transaction,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw new Error('Failed to update transaction');
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error('Failed to delete transaction');
  }
};

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
  } catch (error) {
    throw new Error('Failed to fetch transactions');
  }
}; 