import { Tax } from '../models/Tax';

export class NotificationService {
  async sendTaxNotification(tax: Tax | { id: string; deleted: boolean; updatedAt: Date }, action: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
} 