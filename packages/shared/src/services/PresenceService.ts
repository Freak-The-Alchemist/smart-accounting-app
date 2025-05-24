import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentProject?: string;
  currentOrganization?: string;
}

class PresenceService {
  private static instance: PresenceService;
  private presenceCollection = 'user_presence';
  private presenceTimeout: NodeJS.Timeout | null = null;
  private presenceUnsubscribe: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  async updatePresence(userId: string, userName: string, status: UserPresence['status'], context?: { projectId?: string; organizationId?: string }) {
    try {
      const presenceRef = doc(db, this.presenceCollection, userId);
      await setDoc(presenceRef, {
        userId,
        userName,
        status,
        lastSeen: serverTimestamp(),
        currentProject: context?.projectId,
        currentOrganization: context?.organizationId,
      });

      // Set up automatic status update to 'away' after 5 minutes of inactivity
      if (this.presenceTimeout) {
        clearTimeout(this.presenceTimeout);
      }
      this.presenceTimeout = setTimeout(() => {
        this.updatePresence(userId, userName, 'away', context);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }

  async removePresence(userId: string) {
    try {
      const presenceRef = doc(db, this.presenceCollection, userId);
      await deleteDoc(presenceRef);
      if (this.presenceTimeout) {
        clearTimeout(this.presenceTimeout);
      }
    } catch (error) {
      console.error('Error removing presence:', error);
      throw error;
    }
  }

  subscribeToPresence(callback: (presence: UserPresence[]) => void) {
    const q = query(collection(db, this.presenceCollection));
    this.presenceUnsubscribe = onSnapshot(q, (snapshot) => {
      const presence: UserPresence[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        presence.push({
          ...data,
          lastSeen: data.lastSeen?.toDate(),
        } as UserPresence);
      });
      callback(presence);
    });
  }

  unsubscribeFromPresence() {
    if (this.presenceUnsubscribe) {
      this.presenceUnsubscribe();
      this.presenceUnsubscribe = null;
    }
  }

  async getProjectPresence(projectId: string): Promise<UserPresence[]> {
    try {
      const q = query(
        collection(db, this.presenceCollection),
        where('currentProject', '==', projectId)
      );
      const snapshot = await q.get();
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate(),
      })) as UserPresence[];
    } catch (error) {
      console.error('Error getting project presence:', error);
      throw error;
    }
  }

  async getOrganizationPresence(organizationId: string): Promise<UserPresence[]> {
    try {
      const q = query(
        collection(db, this.presenceCollection),
        where('currentOrganization', '==', organizationId)
      );
      const snapshot = await q.get();
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate(),
      })) as UserPresence[];
    } catch (error) {
      console.error('Error getting organization presence:', error);
      throw error;
    }
  }
}

export default PresenceService; 