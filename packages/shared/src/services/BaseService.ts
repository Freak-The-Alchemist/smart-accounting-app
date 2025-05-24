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
  limit,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from '../firebase/config';

export abstract class BaseService<T> {
  protected collectionRef: CollectionReference;

  constructor(collectionName: string) {
    this.collectionRef = collection(db, collectionName);
  }

  protected async getById(id: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? this.convertToModel(docSnap.data(), docSnap.id) : null;
  }

  protected async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertToModel(doc.data(), doc.id));
  }

  protected async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await addDoc(this.collectionRef, this.convertToFirestore(data));
    const docSnap = await getDoc(docRef);
    return this.convertToModel(docSnap.data()!, docSnap.id);
  }

  protected async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, this.convertToFirestore(data));
  }

  protected async delete(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }

  protected async getByUserId(userId: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const userConstraint = where('userId', '==', userId);
    return this.getAll([userConstraint, ...constraints]);
  }

  protected convertToModel(data: DocumentData, id: string): T {
    return {
      id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as T;
  }

  protected convertToFirestore(data: Partial<T>): DocumentData {
    const firestoreData = { ...data };
    delete (firestoreData as any).id;
    return firestoreData;
  }
} 