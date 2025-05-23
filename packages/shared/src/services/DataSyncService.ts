import { db } from '../config/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface SyncOptions {
  collection: string;
  query?: {
    field: string;
    operator: '==' | '>' | '<' | '>=' | '<=';
    value: any;
  }[];
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export class DataSyncService {
  private static instance: DataSyncService;
  private unsubscribeFunctions: Map<string, () => void>;
  private syncStates: Map<string, boolean>;

  private constructor() {
    this.unsubscribeFunctions = new Map();
    this.syncStates = new Map();
    this.initializeOfflineSupport();
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private async initializeOfflineSupport() {
    try {
      // Initialize Firestore with offline persistence
      initializeFirestore(db, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
      });

      // Enable multi-tab support
      await enableMultiTabIndexedDbPersistence(db, persistentMultipleTabManager());
      console.log('Offline persistence enabled successfully');
    } catch (error) {
      console.error('Error enabling offline persistence:', error);
    }
  }

  async startSync(
    options: SyncOptions,
    onUpdate: (data: any[]) => void,
    onError: (error: Error) => void
  ): Promise<string> {
    const syncId = `${options.collection}-${Date.now()}`;

    try {
      let q = collection(db, options.collection);

      // Apply query filters
      if (options.query) {
        options.query.forEach((filter) => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          this.syncStates.set(syncId, true);
          onUpdate(data);
        },
        (error) => {
          this.syncStates.set(syncId, false);
          onError(error);
        }
      );

      this.unsubscribeFunctions.set(syncId, unsubscribe);
      return syncId;
    } catch (error) {
      onError(error as Error);
      throw error;
    }
  }

  stopSync(syncId: string): void {
    const unsubscribe = this.unsubscribeFunctions.get(syncId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(syncId);
      this.syncStates.delete(syncId);
    }
  }

  isSyncing(syncId: string): boolean {
    return this.syncStates.get(syncId) || false;
  }

  stopAllSyncs(): void {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.syncStates.clear();
  }
}

export const dataSyncService = DataSyncService.getInstance(); 