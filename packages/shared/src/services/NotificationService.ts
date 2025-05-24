import { Tax } from '../models/Tax';
import { Account } from '../models/Account';
import { Organization } from '../models/Organization';
import { NotificationType, NotificationPriority, NotificationStatus, NotificationChannel } from '../models/Notification';
import { User } from '../models/User';
import { BankReconciliation } from '../models/BankReconciliation';

export class NotificationService {
  async sendTaxNotification(tax: Tax | { id: string; deleted?: boolean; updatedAt: Date }, action: string): Promise<void> {
    console.log(`Sending tax notification for ${action} action on tax ${tax.id}`);
    // Simulate async notification sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendAccountNotification(account: Account | { id: string; deleted: boolean; updatedAt: Date }, action: string): Promise<void> {
    try {
      // In a real implementation, this would send notifications through various channels
      // For now, we'll just log the notification
      console.log(`Account notification: ${action}`, {
        accountId: account.id,
        action,
        timestamp: new Date().toISOString(),
        ...(account instanceof Object && 'deleted' in account ? { deleted: account.deleted } : {}),
      });

      // Simulate async notification sending
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to send account notification:', error);
      // In a real implementation, we might want to retry or handle the error differently
      // For now, we'll just log the error and continue
    }
  }

  async sendOrganizationNotification(organization: Organization | { id: string; deleted?: boolean; updatedAt: Date }, action: string): Promise<void> {
    console.log(`Sending organization notification for ${action} action on organization ${organization.id}`);
    // Simulate async notification sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendReconciliationNotification(reconciliation: BankReconciliation | { id: string; deleted?: boolean; updatedAt: Date }, action: string): Promise<void> {
    console.log(`Sending reconciliation notification for ${action} action on reconciliation ${reconciliation.id}`);
    // Simulate async notification sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async sendUserNotification(user: User | { id: string; deleted?: boolean; updatedAt: Date }, action: string): Promise<void> {
    console.log(`Sending user notification for ${action} action on user ${user.id}`);
    // Simulate async notification sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }
} 