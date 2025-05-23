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
import { FuelSale } from '../types/petrolStation';

const COLLECTION_NAME = 'fuelSales';

const convertTimestampToDate = (data: any): FuelSale => ({
  ...data,
  timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
});

export const createFuelSale = async (sale: Omit<FuelSale, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...sale,
    timestamp: Timestamp.fromDate(sale.timestamp),
  });
  return docRef.id;
};

export const getFuelSale = async (id: string): Promise<FuelSale | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  return convertTimestampToDate({
    id: docSnap.id,
    ...docSnap.data(),
  });
};

export const updateFuelSale = async (id: string, sale: Partial<FuelSale>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData = { ...sale };
  
  if (sale.timestamp) {
    updateData.timestamp = Timestamp.fromDate(sale.timestamp);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteFuelSale = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getFuelSalesByShift = async (shiftId: string): Promise<FuelSale[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('shiftId', '==', shiftId),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => 
    convertTimestampToDate({
      id: doc.id,
      ...doc.data(),
    })
  );
};

export const getFuelSalesByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<FuelSale[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => 
    convertTimestampToDate({
      id: doc.id,
      ...doc.data(),
    })
  );
}; 