import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { StorageService } from './storageService';

export class SyncService {
  private static instance: SyncService;
  private storageService: StorageService;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  startAutoSync(interval: number = 5 * 60 * 1000) { // Default: 5 minutes
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => this.sync(), interval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync() {
    if (this.syncInProgress || !navigator.onLine) return;

    try {
      this.syncInProgress = true;
      const pendingChanges = await this.storageService.getPendingChanges();

      for (const change of pendingChanges) {
        try {
          await this.processChange(change);
          await this.storageService.clearPendingChanges();
        } catch (error) {
          console.error(`Error processing change:`, error);
          // Keep the change in pending changes for retry
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processChange(change: any) {
    const { collection: collectionName, operation, data } = change;

    switch (operation) {
      case 'create':
      case 'update':
        await setDoc(doc(db, collectionName, data.id), data);
        break;
      case 'delete':
        await deleteDoc(doc(db, collectionName, data.id));
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async addToSyncQueue(change: {
    collection: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }) {
    await this.storageService.addPendingChange(change);
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }
  }
} 