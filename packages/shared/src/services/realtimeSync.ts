import { getFirestore, onSnapshot, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getCurrentLocation } from './location';

interface DeviceSession {
  deviceId: string;
  lastActive: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  platform: 'web' | 'mobile';
}

interface SyncOptions {
  maxDistanceInMeters?: number;
  syncInterval?: number;
}

const DEFAULT_OPTIONS: SyncOptions = {
  maxDistanceInMeters: 100, // 100 meters
  syncInterval: 5000 // 5 seconds
};

export class RealtimeSync {
  private static instance: RealtimeSync;
  private db = getFirestore();
  private auth = getAuth();
  private deviceId: string;
  private options: SyncOptions;
  private unsubscribeCallbacks: (() => void)[] = [];

  private constructor(options: SyncOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.deviceId = this.generateDeviceId();
  }

  public static getInstance(options?: SyncOptions): RealtimeSync {
    if (!RealtimeSync.instance) {
      RealtimeSync.instance = new RealtimeSync(options);
    }
    return RealtimeSync.instance;
  }

  private generateDeviceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateDeviceSession() {
    if (!this.auth.currentUser) return;

    const location = await getCurrentLocation();
    const session: DeviceSession = {
      deviceId: this.deviceId,
      lastActive: new Date(),
      location,
      platform: this.isMobile() ? 'mobile' : 'web'
    };

    const sessionRef = doc(this.db, 'users', this.auth.currentUser.uid, 'sessions', this.deviceId);
    await sessionRef.set(session, { merge: true });
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private async validateDeviceProximity(): Promise<boolean> {
    if (!this.auth.currentUser) return false;

    const sessionsRef = collection(this.db, 'users', this.auth.currentUser.uid, 'sessions');
    const sessionsSnapshot = await getDocs(sessionsRef);
    const currentLocation = await getCurrentLocation();

    for (const sessionDoc of sessionsSnapshot.docs) {
      const session = sessionDoc.data() as DeviceSession;
      if (session.deviceId === this.deviceId) continue;

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        session.location.latitude,
        session.location.longitude
      );

      if (distance > this.options.maxDistanceInMeters!) {
        return false;
      }
    }

    return true;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  public async startSync() {
    if (!this.auth.currentUser) return;

    // Start periodic session updates
    setInterval(() => this.updateDeviceSession(), this.options.syncInterval);

    // Set up real-time listeners for data changes
    const collections = ['shifts', 'fuelSales', 'expenses'];
    
    for (const collectionName of collections) {
      const q = query(
        collection(this.db, collectionName),
        where('userId', '==', this.auth.currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const isValid = await this.validateDeviceProximity();
        if (!isValid) {
          console.warn('Device proximity validation failed');
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            this.emitChange(collectionName, change.doc.data());
          }
        });
      });

      this.unsubscribeCallbacks.push(unsubscribe);
    }
  }

  public stopSync() {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
  }

  private emitChange(collection: string, data: any) {
    const event = new CustomEvent('realtime-sync', {
      detail: { collection, data }
    });
    window.dispatchEvent(event);
  }
} 