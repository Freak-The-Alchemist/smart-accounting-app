import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'failed_attempts' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
  status: 'active' | 'resolved' | 'investigating';
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}

export interface SecurityMetrics {
  totalLogins: number;
  failedAttempts: number;
  suspiciousActivities: number;
  activeAlerts: number;
  lastIncident: Timestamp | null;
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;

  private constructor() {}

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  // Security Alerts
  async createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const alert: Omit<SecurityAlert, 'id'> = {
      type,
      severity,
      description,
      metadata,
      timestamp: serverTimestamp() as Timestamp,
      status: 'active',
    };

    const docRef = await addDoc(collection(db, 'securityAlerts'), alert);
    return docRef.id;
  }

  async getAlerts(
    filters: {
      type?: SecurityAlert['type'];
      severity?: SecurityAlert['severity'];
      status?: SecurityAlert['status'];
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100
  ): Promise<SecurityAlert[]> {
    let q = query(collection(db, 'securityAlerts'));

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    q = query(q, orderBy('timestamp', 'desc'), limit(limit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SecurityAlert[];
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    const alertRef = doc(db, 'securityAlerts', alertId);
    await addDoc(collection(db, 'securityAlerts'), {
      ...(await this.getAlert(alertId)),
      status: 'resolved',
      resolvedBy,
      resolvedAt: serverTimestamp(),
    });
  }

  private async getAlert(alertId: string): Promise<SecurityAlert> {
    const q = query(
      collection(db, 'securityAlerts'),
      where('id', '==', alertId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Alert not found');
    }

    return snapshot.docs[0].data() as SecurityAlert;
  }

  // Security Metrics
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      loginSnapshot,
      failedAttemptsSnapshot,
      suspiciousActivitiesSnapshot,
      activeAlertsSnapshot,
      lastIncidentSnapshot,
    ] = await Promise.all([
      getDocs(query(
        collection(db, 'auditLogs'),
        where('action', '==', 'login'),
        where('timestamp', '>=', Timestamp.fromDate(dayAgo))
      )),
      getDocs(query(
        collection(db, 'auditLogs'),
        where('action', '==', 'login_failed'),
        where('timestamp', '>=', Timestamp.fromDate(dayAgo))
      )),
      getDocs(query(
        collection(db, 'securityAlerts'),
        where('status', '==', 'active'),
        where('severity', 'in', ['high', 'critical'])
      )),
      getDocs(query(
        collection(db, 'securityAlerts'),
        where('status', '==', 'active')
      )),
      getDocs(query(
        collection(db, 'securityAlerts'),
        orderBy('timestamp', 'desc'),
        limit(1)
      )),
    ]);

    return {
      totalLogins: loginSnapshot.size,
      failedAttempts: failedAttemptsSnapshot.size,
      suspiciousActivities: suspiciousActivitiesSnapshot.size,
      activeAlerts: activeAlertsSnapshot.size,
      lastIncident: lastIncidentSnapshot.empty
        ? null
        : (lastIncidentSnapshot.docs[0].data().timestamp as Timestamp),
    };
  }

  // Threat Detection
  async detectSuspiciousActivity(
    userId: string,
    action: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    // Check for multiple failed login attempts
    if (action === 'login_failed') {
      const failedAttempts = await this.getFailedAttempts(userId);
      if (failedAttempts >= 5) {
        await this.createAlert(
          'failed_attempts',
          'high',
          'Multiple failed login attempts detected',
          { userId, attempts: failedAttempts }
        );
        return true;
      }
    }

    // Check for unusual login location
    if (action === 'login' && metadata.ipAddress) {
      const isSuspiciousLocation = await this.checkSuspiciousLocation(
        userId,
        metadata.ipAddress
      );
      if (isSuspiciousLocation) {
        await this.createAlert(
          'suspicious_login',
          'medium',
          'Login from unusual location detected',
          { userId, ipAddress: metadata.ipAddress }
        );
        return true;
      }
    }

    // Check for unusual access patterns
    if (action === 'access' && metadata.resourceType) {
      const isUnusualAccess = await this.checkUnusualAccess(
        userId,
        metadata.resourceType
      );
      if (isUnusualAccess) {
        await this.createAlert(
          'unauthorized_access',
          'high',
          'Unusual access pattern detected',
          { userId, resourceType: metadata.resourceType }
        );
        return true;
      }
    }

    return false;
  }

  private async getFailedAttempts(userId: string): Promise<number> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const snapshot = await getDocs(query(
      collection(db, 'auditLogs'),
      where('userId', '==', userId),
      where('action', '==', 'login_failed'),
      where('timestamp', '>=', Timestamp.fromDate(hourAgo))
    ));

    return snapshot.size;
  }

  private async checkSuspiciousLocation(
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    // Implement IP geolocation check
    // This is a placeholder - you would typically use a geolocation service
    return false;
  }

  private async checkUnusualAccess(
    userId: string,
    resourceType: string
  ): Promise<boolean> {
    // Implement access pattern analysis
    // This is a placeholder - you would typically use ML or pattern matching
    return false;
  }
}

export const securityMonitoringService = SecurityMonitoringService.getInstance(); 