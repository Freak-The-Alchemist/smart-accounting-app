import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Notification {
  id: string;
  userId: string;
  type: 'feedback' | 'beta_test' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<string> => {
  const db = getFirestore();
  const notificationsRef = collection(db, 'notifications');

  const notification: Omit<Notification, 'id'> = {
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date(),
    data
  };

  const docRef = await addDoc(notificationsRef, notification);
  return docRef.id;
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const db = getFirestore();
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Notification));
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const db = getFirestore();
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const db = getFirestore();
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));

  const querySnapshot = await getDocs(q);
  const batch = db.batch();

  querySnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

export const createFeedbackNotification = async (
  feedbackId: string,
  feedbackTitle: string,
  status: string
): Promise<void> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const title = 'Feedback Update';
  const message = `Your feedback "${feedbackTitle}" has been ${status.toLowerCase()}`;

  await createNotification(
    currentUser.uid,
    'feedback',
    title,
    message,
    { feedbackId, status }
  );
};

export const createBetaTestNotification = async (
  featureName: string,
  description: string
): Promise<void> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const title = 'New Beta Feature Available';
  const message = `A new feature "${featureName}" is now available for testing`;

  await createNotification(
    currentUser.uid,
    'beta_test',
    title,
    message,
    { featureName, description }
  );
};

export const createSystemNotification = async (
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  await createNotification(
    currentUser.uid,
    'system',
    title,
    message,
    data
  );
}; 