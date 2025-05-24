import { Notification, NotificationType, NotificationStatus } from '../models/Notification';
import { ValidationError } from '../utils/errors';

export class NotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const id = `notification-${Date.now()}`;
    const now = new Date();
    
    const newNotification: Notification = {
      ...notification,
      id,
      status: NotificationStatus.UNREAD,
      createdAt: now,
      updatedAt: now
    };

    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) || null;
  }

  async find(filters: Partial<Notification>): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => {
      return Object.entries(filters).every(([key, value]) => {
        return notification[key as keyof Notification] === value;
      });
    });
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    const notification = await this.findById(id);
    if (!notification) {
      throw new ValidationError('Notification not found');
    }

    const updatedNotification = {
      ...notification,
      ...data,
      updatedAt: new Date()
    };

    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async delete(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    const notifications = await this.find({
      recipientId,
      status: NotificationStatus.UNREAD
    });
    return notifications.length;
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    const notifications = await this.find({
      recipientId,
      status: NotificationStatus.UNREAD
    });

    for (const notification of notifications) {
      await this.update(notification.id, { status: NotificationStatus.READ });
    }
  }

  async getNotificationsByType(type: NotificationType): Promise<Notification[]> {
    return this.find({ type });
  }
} 