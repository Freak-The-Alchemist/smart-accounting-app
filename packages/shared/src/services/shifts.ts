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
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Shift } from '../types/petrolStation';

const COLLECTION_NAME = 'shifts';

interface FirestoreShift extends Omit<Shift, 'startTime' | 'endTime'> {
  startTime: Timestamp;
  endTime?: Timestamp;
}

interface FirestoreShiftWithId extends FirestoreShift {
  id: string;
}

const convertTimestampToDate = (data: FirestoreShiftWithId): Shift => ({
  ...data,
  startTime: data.startTime.toDate(),
  endTime: data.endTime?.toDate(),
});

export const createShift = async (shift: Omit<Shift, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...shift,
    startTime: Timestamp.fromDate(shift.startTime),
    endTime: shift.endTime ? Timestamp.fromDate(shift.endTime) : null,
  });
  return docRef.id;
};

export const getShift = async (id: string): Promise<Shift | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  const { id: _, ...data } = docSnap.data() as FirestoreShiftWithId;
  return convertTimestampToDate({
    id: docSnap.id,
    ...data,
  });
};

export const updateShift = async (id: string, shift: Partial<Shift>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const { startTime, endTime, ...rest } = shift;
  const updateData: Partial<FirestoreShift> = { ...rest };
  
  if (startTime) {
    updateData.startTime = Timestamp.fromDate(startTime);
  }
  if (endTime) {
    updateData.endTime = Timestamp.fromDate(endTime);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteShift = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getActiveShift = async (attendantId: string): Promise<Shift | null> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('attendantId', '==', attendantId),
    where('status', '==', 'active'),
    orderBy('startTime', 'desc'),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const { id: _, ...data } = doc.data() as FirestoreShiftWithId;
  return convertTimestampToDate({
    id: doc.id,
    ...data,
  });
};

export const getShiftsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Shift[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate)),
    orderBy('startTime', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const { id: _, ...data } = doc.data() as FirestoreShiftWithId;
    return convertTimestampToDate({
      id: doc.id,
      ...data,
    });
  });
}; 