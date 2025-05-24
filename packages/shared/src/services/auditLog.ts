import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface AuditLogEntry {
  userId: string;
  action: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  error?: string;
}

export class AuditLogService {
  private static instance: AuditLogService;
  private db = getFirestore();
  private auth = getAuth();

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  public async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const user = this.auth.currentUser;
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
        ipAddress: await this.getIpAddress(),
        userAgent: navigator.userAgent
      };

      await addDoc(collection(this.db, 'auditLogs'), auditEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  public async getRecentLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(this.db, 'auditLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  public async getLogsByAction(action: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(this.db, 'auditLogs'),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  private async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return 'unknown';
    }
  }
} 