import { useState, useEffect, useCallback } from 'react';
import { DocumentData } from 'firebase/firestore';
import { dataSyncManager } from '@smart-accounting/shared/src/services/DataSyncManager';
import { z } from 'zod';

interface UseDataSyncOptions {
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
  validationSchema?: z.ZodSchema;
}

interface UseDataSyncResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  conflicts: Map<string, DocumentData>;
  updateDocument: (docId: string, data: Partial<T>) => Promise<void>;
  resolveConflict: (
    docId: string,
    resolution: 'server' | 'client' | 'merge',
    mergeStrategy?: (server: DocumentData, client: DocumentData) => DocumentData
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDataSync<T extends DocumentData>({
  collection,
  query,
  orderBy,
  limit,
  optimisticUpdates = true,
  conflictResolution = 'last-write-wins',
  validationSchema,
}: UseDataSyncOptions): UseDataSyncResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [conflicts, setConflicts] = useState<Map<string, DocumentData>>(new Map());
  const [syncId, setSyncId] = useState<string | null>(null);

  // Register validation schema if provided
  useEffect(() => {
    if (validationSchema) {
      dataSyncManager.registerSchema(collection, validationSchema);
    }
  }, [collection, validationSchema]);

  // Start sync
  useEffect(() => {
    const startSync = async () => {
      try {
        setIsLoading(true);
        const id = await dataSyncManager.startSync(
          {
            collection,
            query,
            orderBy,
            limit,
            optimisticUpdates,
            conflictResolution,
          },
          (updates) => {
            setData(updates as T[]);
            setIsLoading(false);
          },
          (err) => {
            setError(err);
            setIsLoading(false);
          },
          (newConflicts) => {
            setConflicts(newConflicts);
          }
        );
        setSyncId(id);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    startSync();

    return () => {
      if (syncId) {
        dataSyncManager.stopSync(syncId);
      }
    };
  }, [collection, query, orderBy, limit, optimisticUpdates, conflictResolution]);

  const updateDocument = useCallback(
    async (docId: string, updateData: Partial<T>) => {
      try {
        const currentDoc = data.find((doc) => doc.id === docId);
        if (!currentDoc) {
          throw new Error('Document not found');
        }

        const updatedData = {
          ...currentDoc,
          ...updateData,
        };

        await dataSyncManager.updateDocument(
          collection,
          docId,
          updatedData,
          {
            collection,
            optimisticUpdates,
            conflictResolution,
          }
        );
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [collection, data, optimisticUpdates, conflictResolution]
  );

  const resolveConflict = useCallback(
    async (
      docId: string,
      resolution: 'server' | 'client' | 'merge',
      mergeStrategy?: (server: DocumentData, client: DocumentData) => DocumentData
    ) => {
      try {
        await dataSyncManager.resolveConflict(
          collection,
          docId,
          resolution,
          mergeStrategy
        );
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [collection]
  );

  const refresh = useCallback(async () => {
    if (syncId) {
      dataSyncManager.stopSync(syncId);
      setSyncId(null);
    }
  }, [syncId]);

  return {
    data,
    isLoading,
    error,
    conflicts,
    updateDocument,
    resolveConflict,
    refresh,
  };
} 