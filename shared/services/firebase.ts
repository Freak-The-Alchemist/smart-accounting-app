import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { app } from '../firebase/config';
import type { Transaction, Category, Receipt } from '../types';

// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);

// Collections
const transactionsCollection = collection(db, 'transactions');
const categoriesCollection = collection(db, 'categories');
const receiptsCollection = collection(db, 'receipts');

// Transaction Services
export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  const docRef = await addDoc(transactionsCollection, {
    ...transaction,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const getTransactions = async (userId: string) => {
  const q = query(
    transactionsCollection,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
};

// Category Services
export const addCategory = async (category: Omit<Category, 'id'>) => {
  const docRef = await addDoc(categoriesCollection, {
    ...category,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const getCategories = async (userId: string) => {
  const q = query(
    categoriesCollection,
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Category[];
};

// Receipt Services
export const uploadReceipt = async (file: File, userId: string) => {
  const storageRef = ref(storage, `receipts/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

export const addReceipt = async (receipt: Omit<Receipt, 'id'>) => {
  const docRef = await addDoc(receiptsCollection, {
    ...receipt,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const getReceipts = async (userId: string) => {
  const q = query(
    receiptsCollection,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Receipt[];
}; 