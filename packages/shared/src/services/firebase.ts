import {
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
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  FuelSale,
  Shift,
  Expense,
  StockItem,
  User,
  Station,
  ShiftStatus,
  DailyReport,
} from '../types/petrolStation';

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (data: DocumentData) => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  return result;
};

// Generic CRUD operations
const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

const getDocument = async <T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  const convertedData = convertTimestamp(data);
  return { id: docSnap.id, ...convertedData } as unknown as T;
};

const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  const updateData = { ...data };
  
  // Convert Date objects to Timestamps
  Object.keys(updateData).forEach(key => {
    if (updateData[key] instanceof Date) {
      updateData[key] = Timestamp.fromDate(updateData[key]);
    }
  });
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: Timestamp.now(),
  });
};

const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// Fuel Sales
export const createFuelSale = async (sale: Omit<FuelSale, 'id'>) => {
  const docRef = await addDoc(collection(db, 'fuelSales'), sale);
  return { id: docRef.id, ...sale };
};

export const getFuelSalesByShift = async (shiftId: string) => {
  const q = query(
    collection(db, 'fuelSales'),
    where('shiftId', '==', shiftId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as FuelSale[];
};

// Shifts
export const createShift = async (shift: Omit<Shift, 'id'>) => {
  const docRef = await addDoc(collection(db, 'shifts'), shift);
  return { id: docRef.id, ...shift };
};

export const updateShift = async (id: string, data: Partial<Shift>) => {
  const shiftRef = doc(db, 'shifts', id);
  await updateDoc(shiftRef, data);
  return { id, ...data };
};

export const getActiveShift = async (attendantId: string) => {
  const q = query(
    collection(db, 'shifts'),
    where('attendantId', '==', attendantId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...convertTimestamp(doc.data()) } as Shift;
};

// Expenses
export const createExpense = async (expense: Omit<Expense, 'id'>) => {
  const docRef = await addDoc(collection(db, 'expenses'), expense);
  return { id: docRef.id, ...expense };
};

export const getExpensesByShift = async (shiftId: string) => {
  const q = query(
    collection(db, 'expenses'),
    where('shiftId', '==', shiftId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as Expense[];
};

// Stock Items
export const createStockItem = async (item: Omit<StockItem, 'id'>) => {
  const docRef = await addDoc(collection(db, 'stockItems'), item);
  return { id: docRef.id, ...item };
};

export const updateStockItem = async (id: string, data: Partial<StockItem>) => {
  const itemRef = doc(db, 'stockItems', id);
  await updateDoc(itemRef, data);
  return { id, ...data };
};

export const getLowStockItems = async () => {
  const q = query(
    collection(db, 'stockItems'),
    where('quantity', '<=', 'reorderLevel')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamp(doc.data())
  })) as StockItem[];
};

// Daily Reports
export const createDailyReport = async (report: Omit<DailyReport, 'id'>) => {
  const docRef = await addDoc(collection(db, 'dailyReports'), report);
  return { id: docRef.id, ...report };
};

export const getDailyReport = async (date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'dailyReports'),
    where('date', '>=', startOfDay),
    where('date', '<=', endOfDay)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...convertTimestamp(doc.data()) } as DailyReport;
};

// Users
export const createUser = async (user: Omit<User, 'id'>): Promise<string> => {
  const userData = {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
  };
  return createDocument<User>('users', userData);
};

export const getUser = async (id: string): Promise<User | null> => {
  return getDocument<User>('users', id);
};

// Stations
export const createStation = async (station: Omit<Station, 'id'>): Promise<string> => {
  const stationData = {
    ...station,
    createdAt: Timestamp.fromDate(station.createdAt),
  };
  return createDocument<Station>('stations', stationData);
};

export const getStation = async (id: string): Promise<Station | null> => {
  return getDocument<Station>('stations', id);
};

export const updateStationSettings = async (
  id: string,
  settings: Station['settings']
): Promise<void> => {
  await updateDocument<Station>('stations', id, { settings });
}; 