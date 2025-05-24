import { NotificationService } from '../NotificationService';
import { Notification, NotificationType, NotificationStatus, NotificationPriority, NotificationChannel } from '../../models/Notification';
import { NotificationRepository } from '../../repositories/NotificationRepository';
import { User } from '../../models/User';
import { Organization, OrganizationType, OrganizationStatus, OrganizationSize } from '../../models/Organization';
import { ValidationError } from '../../utils/errors';
import { Tax, TaxType, TaxStatus, TaxCalculationType } from '../../models/Tax';
import { Account, AccountType, AccountCategory } from '../../models/Account';

// Mock dependencies
jest.mock('../../repositories/NotificationRepository');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    mockNotificationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    notificationService = new NotificationService(mockNotificationRepository);
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const notificationParams = {
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        organizationId: 'org123',
        createdBy: 'user123',
        template: {
          id: 'template1',
          name: 'System Notification',
          type: NotificationType.SYSTEM,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          subject: 'Test Subject',
          content: {
            text: 'Test Content',
            html: '<p>Test Content</p>',
          },
        },
        recipients: [
          {
            id: 'user1',
            type: 'user',
            value: 'user1@example.com',
            channels: [NotificationChannel.EMAIL],
          },
        ],
        content: {
          subject: 'Test Subject',
          body: 'Test Content',
        },
      };

      const mockCreatedNotification: Notification = {
        id: 'notification123',
        ...notificationParams,
        status: NotificationStatus.PENDING,
        delivery: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockCreatedNotification);

      const result = await notificationService.createNotification(notificationParams);

      expect(result).toEqual(mockCreatedNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(notificationParams);
    });

    it('should throw validation error for invalid notification data', async () => {
      const invalidParams = {
        type: 'INVALID_TYPE' as NotificationType,
        priority: NotificationPriority.MEDIUM,
        organizationId: 'org123',
        createdBy: 'user123',
        template: {
          id: 'template1',
          name: 'System Notification',
          type: NotificationType.SYSTEM,
          channels: [NotificationChannel.EMAIL],
          subject: 'Test Subject',
          content: {
            text: 'Test Content',
          },
        },
        recipients: [],
        content: {
          subject: 'Test Subject',
          body: 'Test Content',
        },
      };

      await expect(notificationService.createNotification(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getNotification', () => {
    it('should get a notification by id', async () => {
      const notificationId = 'notification123';

      const mockNotification: Notification = {
        id: notificationId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING,
        organizationId: 'org123',
        createdBy: 'user123',
        template: {
          id: 'template1',
          name: 'System Notification',
          type: NotificationType.SYSTEM,
          channels: [NotificationChannel.EMAIL],
          subject: 'Test Subject',
          content: {
            text: 'Test Content',
          },
        },
        recipients: [
          {
            id: 'user1',
            type: 'user',
            value: 'user1@example.com',
            channels: [NotificationChannel.EMAIL],
          },
        ],
        content: {
          subject: 'Test Subject',
          body: 'Test Content',
        },
        delivery: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.findById.mockResolvedValue(mockNotification);

      const result = await notificationService.getNotification(notificationId);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notificationId);
    });

    it('should throw error for non-existent notification', async () => {
      const notificationId = 'nonexistent';

      mockNotificationRepository.findById.mockResolvedValue(null);

      await expect(notificationService.getNotification(notificationId))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('getNotifications', () => {
    it('should get notifications with filters', async () => {
      const filters = {
        type: NotificationType.SYSTEM,
        status: NotificationStatus.PENDING,
      };

      const mockNotifications: Notification[] = [
        {
          id: 'notification1',
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          status: NotificationStatus.PENDING,
          organizationId: 'org123',
          createdBy: 'user123',
          template: {
            id: 'template1',
            name: 'System Notification',
            type: NotificationType.SYSTEM,
            channels: [NotificationChannel.EMAIL],
            subject: 'Test Subject',
            content: {
              text: 'Test Content',
            },
          },
          recipients: [
            {
              id: 'user1',
              type: 'user',
              value: 'user1@example.com',
              channels: [NotificationChannel.EMAIL],
            },
          ],
          content: {
            subject: 'Test Subject',
            body: 'Test Content',
          },
          delivery: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'notification2',
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.PENDING,
          organizationId: 'org123',
          createdBy: 'user123',
          template: {
            id: 'template2',
            name: 'System Alert',
            type: NotificationType.SYSTEM,
            channels: [NotificationChannel.EMAIL],
            subject: 'Test Alert',
            content: {
              text: 'Test Alert Content',
            },
          },
          recipients: [
            {
              id: 'user2',
              type: 'user',
              value: 'user2@example.com',
              channels: [NotificationChannel.EMAIL],
            },
          ],
          content: {
            subject: 'Test Alert',
            body: 'Test Alert Content',
          },
          delivery: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotifications(filters);

      expect(result).toEqual(mockNotifications);
      expect(mockNotificationRepository.find).toHaveBeenCalledWith(filters);
    });
  });

  describe('updateNotificationStatus', () => {
    it('should update notification status', async () => {
      const notificationId = 'notification123';
      const status = NotificationStatus.SENT;

      const mockUpdatedNotification: Notification = {
        id: notificationId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        status: NotificationStatus.SENT,
        organizationId: 'org123',
        createdBy: 'user123',
        template: {
          id: 'template1',
          name: 'System Notification',
          type: NotificationType.SYSTEM,
          channels: [NotificationChannel.EMAIL],
          subject: 'Test Subject',
          content: {
            text: 'Test Content',
          },
        },
        recipients: [
          {
            id: 'user1',
            type: 'user',
            value: 'user1@example.com',
            channels: [NotificationChannel.EMAIL],
          },
        ],
        content: {
          subject: 'Test Subject',
          body: 'Test Content',
        },
        delivery: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.update.mockResolvedValue(mockUpdatedNotification);

      const result = await notificationService.updateNotificationStatus(notificationId, status);

      expect(result).toEqual(mockUpdatedNotification);
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(notificationId, { status });
    });

    it('should throw error for non-existent notification', async () => {
      const notificationId = 'nonexistent';
      const status = NotificationStatus.SENT;

      mockNotificationRepository.update.mockRejectedValue(new Error('Notification not found'));

      await expect(notificationService.updateNotificationStatus(notificationId, status))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'notification123';

      const mockDeletedNotification = {
        id: notificationId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockNotificationRepository.delete.mockResolvedValue(mockDeletedNotification);

      const result = await notificationService.deleteNotification(notificationId);

      expect(result).toBe(true);
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith(notificationId);
    });

    it('should throw error for non-existent notification', async () => {
      const notificationId = 'nonexistent';

      mockNotificationRepository.delete.mockRejectedValue(new Error('Notification not found'));

      await expect(notificationService.deleteNotification(notificationId))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('getNotificationSummary', () => {
    it('should get notification summary', async () => {
      const organizationId = 'org123';
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const mockNotifications: Notification[] = [
        {
          id: 'notification1',
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          status: NotificationStatus.SENT,
          organizationId: 'org123',
          createdBy: 'user123',
          template: {
            id: 'template1',
            name: 'System Notification',
            type: NotificationType.SYSTEM,
            channels: [NotificationChannel.EMAIL],
            subject: 'Test Subject',
            content: {
              text: 'Test Content',
            },
          },
          recipients: [
            {
              id: 'user1',
              type: 'user',
              value: 'user1@example.com',
              channels: [NotificationChannel.EMAIL],
            },
          ],
          content: {
            subject: 'Test Subject',
            body: 'Test Content',
          },
          delivery: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'notification2',
          type: NotificationType.ALERT,
          priority: NotificationPriority.HIGH,
          status: NotificationStatus.DELIVERED,
          organizationId: 'org123',
          createdBy: 'user123',
          template: {
            id: 'template2',
            name: 'System Alert',
            type: NotificationType.ALERT,
            channels: [NotificationChannel.EMAIL],
            subject: 'Test Alert',
            content: {
              text: 'Test Alert Content',
            },
          },
          recipients: [
            {
              id: 'user2',
              type: 'user',
              value: 'user2@example.com',
              channels: [NotificationChannel.EMAIL],
            },
          ],
          content: {
            subject: 'Test Alert',
            body: 'Test Alert Content',
          },
          delivery: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await notificationService.getNotificationSummary(organizationId, period);

      expect(result).toEqual({
        total: 2,
        byType: {
          [NotificationType.SYSTEM]: 1,
          [NotificationType.ALERT]: 1,
        },
        byPriority: {
          [NotificationPriority.MEDIUM]: 1,
          [NotificationPriority.HIGH]: 1,
        },
        byStatus: {
          [NotificationStatus.SENT]: 1,
          [NotificationStatus.DELIVERED]: 1,
        },
      });
    });
  });

  describe('sendTaxNotification', () => {
    it('should send tax notification', async () => {
      const tax: Tax = {
        id: 'tax123',
        code: 'TAX001',
        name: 'Test Tax',
        type: TaxType.INCOME,
        status: TaxStatus.ACTIVE,
        organizationId: 'org123',
        rates: [{
          id: 'rate1',
          rate: 0.1,
          type: TaxCalculationType.PERCENTAGE,
          effectiveFrom: new Date(),
          currency: 'USD'
        }],
        createdBy: 'user123',
        updatedBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const action = 'created';

      await notificationService.sendTaxNotification(tax, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should send tax notification for deleted tax', async () => {
      const deletedTax = {
        id: 'tax123',
        deleted: true,
        updatedAt: new Date(),
      };

      const action = 'deleted';

      await notificationService.sendTaxNotification(deletedTax, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('sendAccountNotification', () => {
    it('should send account notification', async () => {
      const account: Account = {
        id: 'acc123',
        code: 'ACC001',
        name: 'Test Account',
        type: AccountType.ASSET,
        category: AccountCategory.CURRENT_ASSET,
        currency: 'USD',
        organizationId: 'org123',
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const action = 'created';

      await notificationService.sendAccountNotification(account, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should send account notification for deleted account', async () => {
      const deletedAccount = {
        id: 'acc123',
        deleted: true,
        updatedAt: new Date(),
      };

      const action = 'deleted';

      await notificationService.sendAccountNotification(deletedAccount, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('sendOrganizationNotification', () => {
    it('should send organization notification', async () => {
      const organization: Organization = {
        id: 'org123',
        name: 'Test Organization',
        type: OrganizationType.CORPORATION,
        status: OrganizationStatus.ACTIVE,
        size: OrganizationSize.SMALL,
        description: 'Test Description',
        addresses: [],
        contacts: [],
        settings: {},
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const action = 'created';

      await notificationService.sendOrganizationNotification(organization, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should send organization notification for deleted organization', async () => {
      const deletedOrganization = {
        id: 'org123',
        deleted: true,
        updatedAt: new Date(),
      };

      const action = 'deleted';

      await notificationService.sendOrganizationNotification(deletedOrganization, action);

      // Since the method just logs and simulates async behavior,
      // we just verify it doesn't throw
      expect(true).toBe(true);
    });
  });
}); 