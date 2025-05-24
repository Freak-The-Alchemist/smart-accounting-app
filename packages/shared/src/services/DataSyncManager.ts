import { db } from '../config/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
  CollectionReference,
} from 'firebase/firestore';
import { dataValidationService } from './DataValidationService';

interface SyncMetadata {
  lastModified: Timestamp;
  modifiedBy: string;
  version: number;
}

interface SyncOptions {
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
  optimisticUpdates?: boolean;
  conflictResolution?: 'server' | 'client' | 'last-write-wins';
}

interface SyncState {
  isSyncing: boolean;
  lastSync: Timestamp | null;
  pendingChanges: Map<string, DocumentData>;
  conflicts: Map<string, DocumentData>;
}

export class DataSyncManager {
  private static instance: DataSyncManager;
  private syncStates: Map<string, SyncState>;
  private unsubscribeFunctions: Map<string, () => void>;
  private validationSchemas: Map<string, any>;

  private constructor() {
    this.syncStates = new Map();
    this.unsubscribeFunctions = new Map();
    this.validationSchemas = new Map();
  }

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  registerSchema(collection: string, schema: any) {
    this.validationSchemas.set(collection, schema);
  }

  async startSync(
    options: SyncOptions,
    onUpdate: (data: DocumentData[]) => void,
    onError: (error: Error) => void,
    onConflict?: (conflicts: Map<string, DocumentData>) => void
  ): Promise<string> {
    const syncId = `${options.collection}-${Date.now()}`;
    const syncState: SyncState = {
      isSyncing: true,
      lastSync: null,
      pendingChanges: new Map(),
      conflicts: new Map(),
    };

    this.syncStates.set(syncId, syncState);

    try {
      let q: Query<DocumentData> = collection(db, options.collection);

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
        async (snapshot) => {
          const changes = snapshot.docChanges();
          const updates: DocumentData[] = [];

          for (const change of changes) {
            const docData = change.doc.data();
            const docId = change.doc.id;

            // Handle conflicts
            if (change.type === 'modified' && syncState.pendingChanges.has(docId)) {
              const pendingChange = syncState.pendingChanges.get(docId);
              const serverData = docData;

              if (!pendingChange) continue;

              if (options.conflictResolution === 'server') {
                // Server wins
                syncState.pendingChanges.delete(docId);
                updates.push(serverData);
              } else if (options.conflictResolution === 'client') {
                // Client wins
                const batch = writeBatch(db);
                const docRef = doc(db, options.collection, docId);
                batch.set(docRef, {
                  ...pendingChange,
                  _metadata: {
                    ...pendingChange._metadata,
                    lastModified: serverTimestamp(),
                    version: (serverData._metadata?.version || 0) + 1,
                  },
                });
                await batch.commit();
                updates.push(pendingChange);
              } else {
                // Last write wins
                const clientTimestamp = pendingChange._metadata?.lastModified;
                const serverTimestamp = serverData._metadata?.lastModified;

                if (clientTimestamp && serverTimestamp) {
                  if (clientTimestamp.toMillis() > serverTimestamp.toMillis()) {
                    const batch = writeBatch(db);
                    const docRef = doc(db, options.collection, docId);
                    batch.set(docRef, {
                      ...pendingChange,
                      _metadata: {
                        ...pendingChange._metadata,
                        lastModified: serverTimestamp(),
                        version: (serverData._metadata?.version || 0) + 1,
                      },
                    });
                    await batch.commit();
                    updates.push(pendingChange);
                  } else {
                    syncState.pendingChanges.delete(docId);
                    updates.push(serverData);
                  }
                }
              }

              // Add to conflicts if not resolved
              if (syncState.pendingChanges.has(docId)) {
                syncState.conflicts.set(docId, {
                  server: serverData,
                  client: pendingChange,
                });
                onConflict?.(syncState.conflicts);
              }
            } else {
              updates.push(docData);
            }
          }

          syncState.lastSync = Timestamp.now();
          onUpdate(updates);
        },
        (error) => {
          syncState.isSyncing = false;
          onError(error);
        }
      );

      this.unsubscribeFunctions.set(syncId, unsubscribe);
      return syncId;
    } catch (error) {
      syncState.isSyncing = false;
      onError(error as Error);
      throw error;
    }
  }

  async updateDocument(
    collection: string,
    docId: string,
    data: DocumentData,
    options: SyncOptions
  ): Promise<void> {
    const syncState = Array.from(this.syncStates.values()).find(
      (state) => state.isSyncing
    );

    if (!syncState) {
      throw new Error('No active sync found');
    }

    // Validate data if schema exists
    const schema = this.validationSchemas.get(collection);
    if (schema) {
      dataValidationService.validateData(data, schema);
    }

    // Add metadata
    const metadata: SyncMetadata = {
      lastModified: Timestamp.now(),
      modifiedBy: 'client',
      version: (data._metadata?.version || 0) + 1,
    };

    const updatedData = {
      ...data,
      _metadata: metadata,
    };

    if (options.optimisticUpdates) {
      // Store pending change
      syncState.pendingChanges.set(docId, updatedData);
    }

    // Update document
    const docRef = doc(db, collection, docId);
    await writeBatch(db).set(docRef, updatedData).commit();
  }

  async resolveConflict(
    collection: string,
    docId: string,
    resolution: 'server' | 'client' | 'merge',
    mergeStrategy?: (server: DocumentData, client: DocumentData) => DocumentData
  ): Promise<void> {
    const syncState = Array.from(this.syncStates.values()).find(
      (state) => state.isSyncing
    );

    if (!syncState) {
      throw new Error('No active sync found');
    }

    const conflict = syncState.conflicts.get(docId);
    if (!conflict) {
      throw new Error('No conflict found for document');
    }

    const docRef = doc(db, collection, docId);
    const batch = writeBatch(db);

    switch (resolution) {
      case 'server':
        batch.set(docRef, conflict.server);
        syncState.pendingChanges.delete(docId);
        break;
      case 'client':
        batch.set(docRef, conflict.client);
        break;
      case 'merge':
        if (!mergeStrategy) {
          throw new Error('Merge strategy required for merge resolution');
        }
        const mergedData = mergeStrategy(conflict.server, conflict.client);
        batch.set(docRef, {
          ...mergedData,
          _metadata: {
            ...mergedData._metadata,
            lastModified: Timestamp.now(),
            version: (conflict.server._metadata?.version || 0) + 1,
          },
        });
        break;
    }

    await batch.commit();
    syncState.conflicts.delete(docId);
  }

  stopSync(syncId: string): void {
    const unsubscribe = this.unsubscribeFunctions.get(syncId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(syncId);
      this.syncStates.delete(syncId);
    }
  }

  getSyncState(syncId: string): SyncState | undefined {
    return this.syncStates.get(syncId);
  }

  stopAllSyncs(): void {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.syncStates.clear();
  }
}

export const dataSyncManager = DataSyncManager.getInstance(); 