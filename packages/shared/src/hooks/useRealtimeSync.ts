import { useEffect, useState } from 'react';
import { RealtimeSync } from '../services/realtimeSync';
import { useAuth } from '../contexts/AuthContext';

interface SyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  error: Error | null;
}

export const useRealtimeSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSync: null,
    error: null
  });
  const { user } = useAuth();
  const [realtimeSync] = useState(() => RealtimeSync.getInstance());

  useEffect(() => {
    if (!user) {
      realtimeSync.stopSync();
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      return;
    }

    const startSync = async () => {
      try {
        await realtimeSync.startSync();
        setSyncState(prev => ({
          ...prev,
          isSyncing: true,
          error: null
        }));
      } catch (error) {
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          error: error as Error
        }));
      }
    };

    startSync();

    const handleSync = (event: CustomEvent) => {
      setSyncState(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    };

    window.addEventListener('realtime-sync', handleSync as EventListener);

    return () => {
      realtimeSync.stopSync();
      window.removeEventListener('realtime-sync', handleSync as EventListener);
    };
  }, [user, realtimeSync]);

  return syncState;
}; 