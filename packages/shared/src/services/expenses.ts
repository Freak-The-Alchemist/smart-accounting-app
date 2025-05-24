import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types/petrolStation';

const COLLECTION_NAME = 'expenses';

interface FirestoreExpense extends Omit<Expense, 'timestamp' | 'approvedAt'> {
  timestamp: Timestamp;
  approvedAt?: Timestamp;
}

interface FirestoreExpenseWithId extends FirestoreExpense {
  id: string;
}

const convertTimestampToDate = (data: FirestoreExpenseWithId): Expense => ({
  ...data,
  timestamp: data.timestamp.toDate(),
  approvedAt: data.approvedAt?.toDate(),
});

export const createExpense = async (expense: Omit<Expense, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...expense,
    timestamp: Timestamp.fromDate(expense.timestamp),
    approvedAt: expense.approvedAt ? Timestamp.fromDate(expense.approvedAt) : null,
  });
  return docRef.id;
};

export const getExpense = async (id: string): Promise<Expense | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  const { id: _, ...data } = docSnap.data() as FirestoreExpenseWithId;
  return convertTimestampToDate({
    id: docSnap.id,
    ...data,
  });
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const { timestamp, approvedAt, ...rest } = expense;
  const updateData: Partial<FirestoreExpense> = { ...rest };
  
  if (timestamp) {
    updateData.timestamp = Timestamp.fromDate(timestamp);
  }
  if (approvedAt) {
    updateData.approvedAt = Timestamp.fromDate(approvedAt);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getExpensesByShift = async (shiftId: string): Promise<Expense[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('shiftId', '==', shiftId),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const { id: _, ...data } = doc.data() as FirestoreExpenseWithId;
    return convertTimestampToDate({
      id: doc.id,
      ...data,
    });
  });
};

export const getExpensesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Expense[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const { id: _, ...data } = doc.data() as FirestoreExpenseWithId;
    return convertTimestampToDate({
      id: doc.id,
      ...data,
    });
  });
};

export const getPendingExpenses = async (): Promise<Expense[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'pending'),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const { id: _, ...data } = doc.data() as FirestoreExpenseWithId;
    return convertTimestampToDate({
      id: doc.id,
      ...data,
    });
  });
}; 