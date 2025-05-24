import { NotificationService } from '../NotificationService';
import { Notification, NotificationType, NotificationStatus } from '../../models/Notification';
import { NotificationRepository } from '../../repositories/NotificationRepository';
import { User } from '../../models/User';
import { Organization } from '../../models/Organization';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/NotificationRepository');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockNotificationRepository = new NotificationRepository() as jest.Mocked<NotificationRepository>;

    // Initialize service with mocked dependencies
    notificationService = new NotificationService(mockNotificationRepository);
  });

  describe('createNotification', () => {
    const notificationParams = {
      type: NotificationType.SYSTEM,
      title: 'Test Notification',
      message: 'This is a test notification',
      recipientId: 'user123',
      metadata: {
        action: 'test_action',
        data: { key: 'value' },
      },
    };

    it('should create notification successfully', async () => {
      const mockNotification = {
        id: 'notif123',
        ...notificationParams,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification(notificationParams);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(notificationParams);
    });

    it('should throw ValidationError for invalid notification parameters', async () => {
      const invalidParams = {
        ...notificationParams,
        title: '', // Invalid empty title
      };

      await expect(notificationService.createNotification(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockNotificationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.createNotification(notificationParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getNotificationById', () => {
    const notificationId = 'notif123';

    it('should return notification by id', async () => {
      const mockNotification = {
        id: notificationId,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
        recipientId: 'user123',
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.findById.mockResolvedValue(mockNotification);

      const result = await notificationService.getNotificationById(notificationId);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notificationId);
    });

    it('should return null for non-existent notification', async () => {
      mockNotificationRepository.findById.mockResolvedValue(null);

      const result = await notificationService.getNotificationById(notificationId);

      expect(result).toBeNull();
    });
  });

  describe('getNotifications', () => {
    const filters = {
      recipientId: 'user123',
      status: NotificationStatus.UNREAD,
    };

    it('should return filtered notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          type: NotificationType.SYSTEM,
          title: 'Notification 1',
          message: 'This is notification 1',
          recipientId: 'user123',
          status: NotificationStatus.UNREAD,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'notif2',
          type: NotificationType.SYSTEM,
          title: 'Notification 2',
          message: 'This is notification 2',
          recipientId: 'user123',
          status: NotificationStatus.UNREAD,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotifications(filters);

      expect(result).toEqual(mockNotifications);
      expect(mockNotificationRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no notifications match filters', async () => {
      mockNotificationRepository.find.mockResolvedValue([]);

      const result = await notificationService.getNotifications(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateNotification', () => {
    const notificationId = 'notif123';
    const updateParams = {
      status: NotificationStatus.READ,
    };

    it('should update notification successfully', async () => {
      const mockUpdatedNotification = {
        id: notificationId,
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        message: 'This is a test notification',
        recipientId: 'user123',
        status: NotificationStatus.READ,
        updatedAt: new Date(),
      };

      mockNotificationRepository.update.mockResolvedValue(mockUpdatedNotification);

      const result = await notificationService.updateNotification(notificationId, updateParams);

      expect(result).toEqual(mockUpdatedNotification);
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(notificationId, updateParams);
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        status: 'INVALID_STATUS' as NotificationStatus,
      };

      await expect(notificationService.updateNotification(notificationId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent notification', async () => {
      mockNotificationRepository.update.mockRejectedValue(new Error('Notification not found'));

      await expect(notificationService.updateNotification(notificationId, updateParams))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('deleteNotification', () => {
    const notificationId = 'notif123';

    it('should delete notification successfully', async () => {
      const mockDeletedNotification = {
        id: notificationId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockNotificationRepository.delete.mockResolvedValue(mockDeletedNotification);

      const result = await notificationService.deleteNotification(notificationId);

      expect(result).toEqual(mockDeletedNotification);
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith(notificationId);
    });

    it('should handle non-existent notification', async () => {
      mockNotificationRepository.delete.mockRejectedValue(new Error('Notification not found'));

      await expect(notificationService.deleteNotification(notificationId))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    const recipientId = 'user123';

    it('should mark all notifications as read successfully', async () => {
      const mockUpdatedNotifications = [
        {
          id: 'notif1',
          status: NotificationStatus.READ,
          updatedAt: new Date(),
        },
        {
          id: 'notif2',
          status: NotificationStatus.READ,
          updatedAt: new Date(),
        },
      ];

      mockNotificationRepository.updateMany.mockResolvedValue(mockUpdatedNotifications);

      const result = await notificationService.markAllAsRead(recipientId);

      expect(result).toEqual(mockUpdatedNotifications);
      expect(mockNotificationRepository.updateMany).toHaveBeenCalledWith(
        { recipientId, status: NotificationStatus.UNREAD },
        { status: NotificationStatus.READ }
      );
    });

    it('should handle repository errors', async () => {
      mockNotificationRepository.updateMany.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.markAllAsRead(recipientId))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getUnreadCount', () => {
    const recipientId = 'user123';

    it('should return unread notification count', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount(recipientId);

      expect(result).toBe(5);
      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        recipientId,
        status: NotificationStatus.UNREAD,
      });
    });

    it('should handle repository errors', async () => {
      mockNotificationRepository.count.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.getUnreadCount(recipientId))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('sendUserNotification', () => {
    const user: User = {
      id: 'user123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should send user notification successfully', async () => {
      const mockNotification = {
        id: 'notif123',
        type: NotificationType.USER,
        title: 'User Notification',
        message: 'This is a user notification',
        recipientId: user.id,
        status: NotificationStatus.UNREAD,
        metadata: {
          action: 'user_updated',
          data: { userId: user.id },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await notificationService.sendUserNotification(user, 'updated');

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: NotificationType.USER,
        title: 'User Updated',
        message: `User ${user.firstName} ${user.lastName} has been updated`,
        recipientId: user.id,
        metadata: {
          action: 'user_updated',
          data: { userId: user.id },
        },
      });
    });

    it('should handle repository errors', async () => {
      mockNotificationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.sendUserNotification(user, 'updated'))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('sendOrganizationNotification', () => {
    const organization: Organization = {
      id: 'org123',
      name: 'Test Organization',
      type: 'business',
      status: 'active',
    };

    it('should send organization notification successfully', async () => {
      const mockNotification = {
        id: 'notif123',
        type: NotificationType.ORGANIZATION,
        title: 'Organization Notification',
        message: 'This is an organization notification',
        recipientId: organization.id,
        status: NotificationStatus.UNREAD,
        metadata: {
          action: 'organization_updated',
          data: { organizationId: organization.id },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await notificationService.sendOrganizationNotification(organization, 'updated');

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        type: NotificationType.ORGANIZATION,
        title: 'Organization Updated',
        message: `Organization ${organization.name} has been updated`,
        recipientId: organization.id,
        metadata: {
          action: 'organization_updated',
          data: { organizationId: organization.id },
        },
      });
    });

    it('should handle repository errors', async () => {
      mockNotificationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(notificationService.sendOrganizationNotification(organization, 'updated'))
        .rejects
        .toThrow('Database error');
    });
  });
}); 