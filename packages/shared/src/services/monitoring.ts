import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { AuditLogService, AuditLogEntry } from './auditLog';

interface Alert {
  type: 'suspicious_login' | 'multiple_failures' | 'unusual_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  userId?: string;
  details: any;
  id: string;
  status: 'new' | 'in_progress' | 'resolved';
}

interface MonitoringConfig {
  maxLoginAttempts: number;
  suspiciousIpThreshold: number;
  unusualActivityThreshold: number;
  alertCheckInterval: number;
}

const CONFIG: MonitoringConfig = {
  maxLoginAttempts: 5,
  suspiciousIpThreshold: 3,
  unusualActivityThreshold: 10,
  alertCheckInterval: 5 * 60 * 1000 // 5 minutes
};

export class MonitoringService {
  private static instance: MonitoringService;
  private db = getFirestore();
  private auditLogService = AuditLogService.getInstance();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkForSuspiciousActivity();
    }, CONFIG.alertCheckInterval);
  }

  private async checkForSuspiciousActivity() {
    try {
      // Check for multiple failed login attempts
      const failedLogins = await this.auditLogService.getLogsByAction('login');
      const recentFailures = failedLogins.filter(
        log => log.status === 'failure' && 
        new Date().getTime() - log.timestamp.getTime() < CONFIG.alertCheckInterval
      );

      if (recentFailures.length >= CONFIG.maxLoginAttempts) {
        await this.createAlert({
          type: 'multiple_failures',
          severity: 'high',
          message: `Multiple failed login attempts detected (${recentFailures.length})`,
          timestamp: new Date(),
          userId: recentFailures[0].userId,
          details: { attempts: recentFailures }
        });
      }

      // Check for suspicious IP addresses
      const ipAddresses = new Map<string, number>();
      failedLogins.forEach(log => {
        if (log.ipAddress) {
          ipAddresses.set(log.ipAddress, (ipAddresses.get(log.ipAddress) || 0) + 1);
        }
      });

      for (const [ip, count] of ipAddresses.entries()) {
        if (count >= CONFIG.suspiciousIpThreshold) {
          await this.createAlert({
            type: 'suspicious_login',
            severity: 'medium',
            message: `Suspicious login activity from IP: ${ip}`,
            timestamp: new Date(),
            details: { ip, attempts: count }
          });
        }
      }

      // Check for unusual activity patterns
      const recentLogs = await this.auditLogService.getRecentLogs('', CONFIG.unusualActivityThreshold);
      const activityCounts = new Map<string, number>();
      
      recentLogs.forEach(log => {
        activityCounts.set(log.action, (activityCounts.get(log.action) || 0) + 1);
      });

      for (const [action, count] of activityCounts.entries()) {
        if (count >= CONFIG.unusualActivityThreshold) {
          await this.createAlert({
            type: 'unusual_activity',
            severity: 'low',
            message: `Unusual activity pattern detected for action: ${action}`,
            timestamp: new Date(),
            details: { action, count }
          });
        }
      }
    } catch (error) {
      console.error('Error checking for suspicious activity:', error);
    }
  }

  private async createAlert(alert: Alert): Promise<void> {
    try {
      await addDoc(collection(this.db, 'alerts'), {
        ...alert,
        timestamp: Timestamp.fromDate(alert.timestamp),
        status: 'new'
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  public async getRecentAlerts(limit: number = 50): Promise<Alert[]> {
    try {
      const q = query(
        collection(this.db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as Alert[];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async updateAlertStatus(alert: Alert, status: Alert['status']): Promise<void> {
    try {
      const alertRef = doc(this.db, 'alerts', alert.id);
      await updateDoc(alertRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }
} 