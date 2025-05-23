import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Feedback {
  id?: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  platform: 'web' | 'mobile' | 'both';
  deviceInfo?: {
    os: string;
    browser?: string;
    device?: string;
    version?: string;
  };
  attachments?: string[]; // URLs to screenshots or logs
  createdAt: Date;
  updatedAt: Date;
}

export interface BetaTester {
  id?: string;
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'accountant' | 'admin';
  platform: 'web' | 'mobile' | 'both';
  status: 'active' | 'inactive';
  joinedAt: Date;
  lastActive: Date;
  feedbackCount: number;
  deviceInfo?: {
    os: string;
    browser?: string;
    device?: string;
    version?: string;
  };
}

const FEEDBACK_COLLECTION = 'feedback';
const BETA_TESTERS_COLLECTION = 'betaTesters';

export const submitFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      ...feedback,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Failed to submit feedback');
  }
};

export const getFeedbackByUser = async (userId: string): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Feedback));
  } catch (error) {
    throw new Error('Failed to fetch feedback');
  }
};

export const registerBetaTester = async (tester: Omit<BetaTester, 'id' | 'joinedAt' | 'lastActive' | 'feedbackCount'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, BETA_TESTERS_COLLECTION), {
      ...tester,
      status: 'active',
      joinedAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      feedbackCount: 0
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Failed to register beta tester');
  }
};

export const getBetaTesters = async (): Promise<BetaTester[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, BETA_TESTERS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BetaTester));
  } catch (error) {
    throw new Error('Failed to fetch beta testers');
  }
};

export const updateBetaTesterStatus = async (testerId: string, status: 'active' | 'inactive'): Promise<void> => {
  try {
    const docRef = doc(db, BETA_TESTERS_COLLECTION, testerId);
    await updateDoc(docRef, {
      status,
      lastActive: Timestamp.now()
    });
  } catch (error) {
    throw new Error('Failed to update beta tester status');
  }
}; 