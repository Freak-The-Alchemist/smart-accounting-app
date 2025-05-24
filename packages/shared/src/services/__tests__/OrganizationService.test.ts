import { OrganizationService } from '../OrganizationService';
import { Organization, OrganizationType, OrganizationStatus, OrganizationSize, OrganizationAddress } from '../../models/Organization';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/OrganizationRepository');
jest.mock('../../repositories/UserRepository');
jest.mock('../NotificationService');

describe('OrganizationService', () => {
  let organizationService: OrganizationService;
  let mockOrganizationRepository: jest.Mocked<OrganizationRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockOrganizationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getOrganizationSummary: jest.fn(),
    } as any;

    mockUserRepository = {
      find: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockNotificationService = {
      sendOrganizationNotification: jest.fn(),
    } as any;

    organizationService = new OrganizationService(
      mockOrganizationRepository,
      mockUserRepository,
      mockNotificationService
    );
  });

  const mockOrganization: Organization = {
    id: '1',
    name: 'Test Organization',
    type: OrganizationType.CORPORATION,
    status: OrganizationStatus.ACTIVE,
    size: OrganizationSize.SMALL,
    description: 'Test organization description',
    addresses: [{
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
      isPrimary: true,
      type: 'PHYSICAL' as const
    }],
    contacts: [{
      name: 'Test Contact',
      title: 'Test Title',
      email: 'test@example.com',
      phone: '1234567890',
      isPrimary: true
    }],
    settings: {
      general: {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        currency: 'USD',
        fiscalYearStart: '01-01',
        language: 'en'
      },
      accounting: {
        chartOfAccounts: 'default',
        defaultTaxRate: 0,
        defaultPaymentTerms: 30,
        defaultInvoiceTemplate: 'default',
        defaultCurrency: 'USD',
        enableMultiCurrency: false,
        enableInventory: false,
        enableProjects: false
      },
      notifications: {
        channels: ['email'],
        defaultRecipients: ['admin@example.com'],
        templates: {}
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90
        },
        sessionPolicy: {
          timeoutMinutes: 30,
          maxConcurrentSessions: 1,
          requireTwoFactor: false
        }
      },
      integrations: {}
    },
    createdBy: 'user1',
    updatedBy: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('createOrganization', () => {
    it('should create a new organization successfully', async () => {
      const organizationParams = {
        name: 'Test Organization',
        type: OrganizationType.CORPORATION,
        status: OrganizationStatus.ACTIVE,
        size: OrganizationSize.SMALL,
        description: 'Test organization description',
        addresses: [{
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          isPrimary: true,
          type: 'PHYSICAL' as const
        }],
        contacts: [{
          name: 'Test Contact',
          title: 'Test Title',
          email: 'test@example.com',
          phone: '1234567890',
          isPrimary: true
        }],
        settings: {
          general: {
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm:ss',
            currency: 'USD',
            fiscalYearStart: '01-01',
            language: 'en'
          },
          accounting: {
            chartOfAccounts: 'default',
            defaultTaxRate: 0,
            defaultPaymentTerms: 30,
            defaultInvoiceTemplate: 'default',
            defaultCurrency: 'USD',
            enableMultiCurrency: false,
            enableInventory: false,
            enableProjects: false
          },
          notifications: {
            channels: ['email'],
            defaultRecipients: ['admin@example.com'],
            templates: {}
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true,
              expiryDays: 90
            },
            sessionPolicy: {
              timeoutMinutes: 30,
              maxConcurrentSessions: 1,
              requireTwoFactor: false
            }
          },
          integrations: {}
        },
        createdBy: 'user1',
        updatedBy: 'user1'
      };

      mockOrganizationRepository.create.mockResolvedValue(mockOrganization);

      const result = await organizationService.createOrganization(organizationParams);

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith(organizationParams);
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockOrganization,
        'created'
      );
    });

    it('should throw ValidationError for invalid organization parameters', async () => {
      const invalidParams = {
        ...mockOrganization,
        name: '', // Invalid empty name
      };

      await expect(organizationService.createOrganization(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle database errors', async () => {
      mockOrganizationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.createOrganization(mockOrganization))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getOrganization', () => {
    it('should return organization by id', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await organizationService.getOrganization('1');

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null for non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      const result = await organizationService.getOrganization('999');

      expect(result).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const updatedData = {
        name: 'Updated Organization',
        type: OrganizationType.CORPORATION,
      };

      const updatedOrganization = {
        ...mockOrganization,
        ...updatedData,
      };

      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.update.mockResolvedValue(updatedOrganization);

      const result = await organizationService.updateOrganization('1', updatedData);

      expect(result).toEqual(updatedOrganization);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('1');
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith('1', updatedData);
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        updatedOrganization,
        'updated'
      );
    });

    it('should throw ValidationError for non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(organizationService.updateOrganization('999', { name: 'Updated' }))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockOrganizationRepository.delete.mockResolvedValue(true);

      const result = await organizationService.deleteOrganization('1');

      expect(result).toBe(true);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith('1');
      expect(mockOrganizationRepository.delete).toHaveBeenCalledWith('1');
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockOrganization,
        'deleted'
      );
    });

    it('should throw ValidationError for non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(organizationService.deleteOrganization('999'))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getOrganizations', () => {
    it('should return all organizations when no filters provided', async () => {
      const organizations = [mockOrganization];
      mockOrganizationRepository.find.mockResolvedValue(organizations);

      const result = await organizationService.getOrganizations();

      expect(result).toEqual(organizations);
      expect(mockOrganizationRepository.find).toHaveBeenCalledWith({});
    });

    it('should return filtered organizations when filters provided', async () => {
      const filters = {
        type: OrganizationType.CORPORATION,
        status: OrganizationStatus.ACTIVE,
      };
      const organizations = [mockOrganization];
      mockOrganizationRepository.find.mockResolvedValue(organizations);

      const result = await organizationService.getOrganizations(filters);

      expect(result).toEqual(organizations);
      expect(mockOrganizationRepository.find).toHaveBeenCalledWith(filters);
    });
  });

  describe('getOrganizationSummary', () => {
    it('should return organization summary', async () => {
      const summary = {
        totalOrganizations: 1,
        organizationsByType: {
          [OrganizationType.CORPORATION]: 1,
          [OrganizationType.PARTNERSHIP]: 0,
          [OrganizationType.SOLE_PROPRIETORSHIP]: 0,
          [OrganizationType.LLC]: 0,
          [OrganizationType.NON_PROFIT]: 0,
          [OrganizationType.GOVERNMENT]: 0,
          [OrganizationType.CUSTOM]: 0,
        },
        organizationsByStatus: {
          [OrganizationStatus.ACTIVE]: 1,
          [OrganizationStatus.INACTIVE]: 0,
          [OrganizationStatus.SUSPENDED]: 0,
          [OrganizationStatus.PENDING]: 0,
          [OrganizationStatus.ARCHIVED]: 0,
        },
      };

      mockOrganizationRepository.getOrganizationSummary.mockResolvedValue(summary);

      const result = await organizationService.getOrganizationSummary();

      expect(result).toEqual(summary);
      expect(mockOrganizationRepository.getOrganizationSummary).toHaveBeenCalled();
    });
  });
}); 