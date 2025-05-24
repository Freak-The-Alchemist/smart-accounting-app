import { OrganizationService } from '../OrganizationService';
import { Organization, OrganizationType, OrganizationStatus } from '../../models/Organization';
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
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockOrganizationRepository = new OrganizationRepository() as jest.Mocked<OrganizationRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    organizationService = new OrganizationService(
      mockOrganizationRepository,
      mockUserRepository,
      mockNotificationService
    );
  });

  describe('createOrganization', () => {
    const organizationParams = {
      name: 'Test Organization',
      type: OrganizationType.BUSINESS,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
      },
      contact: {
        email: 'contact@testorg.com',
        phone: '+1234567890',
      },
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: '01-01',
      },
    };

    it('should create organization successfully', async () => {
      const mockOrganization = {
        id: 'org123',
        ...organizationParams,
        status: OrganizationStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        ...organizationParams,
        name: '', // Invalid empty name
      };

      await expect(organizationService.createOrganization(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockOrganizationRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.createOrganization(organizationParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getOrganizationById', () => {
    const organizationId = 'org123';

    it('should return organization by id', async () => {
      const mockOrganization = {
        id: organizationId,
        name: 'Test Organization',
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await organizationService.getOrganizationById(organizationId);

      expect(result).toEqual(mockOrganization);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(organizationId);
    });

    it('should return null for non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      const result = await organizationService.getOrganizationById(organizationId);

      expect(result).toBeNull();
    });
  });

  describe('getOrganizations', () => {
    const filters = {
      type: OrganizationType.BUSINESS,
      status: OrganizationStatus.ACTIVE,
    };

    it('should return filtered organizations', async () => {
      const mockOrganizations = [
        {
          id: 'org1',
          name: 'Organization 1',
          type: OrganizationType.BUSINESS,
          status: OrganizationStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'org2',
          name: 'Organization 2',
          type: OrganizationType.BUSINESS,
          status: OrganizationStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockOrganizationRepository.find.mockResolvedValue(mockOrganizations);

      const result = await organizationService.getOrganizations(filters);

      expect(result).toEqual(mockOrganizations);
      expect(mockOrganizationRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no organizations match filters', async () => {
      mockOrganizationRepository.find.mockResolvedValue([]);

      const result = await organizationService.getOrganizations(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateOrganization', () => {
    const organizationId = 'org123';
    const updateParams = {
      name: 'Updated Organization',
      contact: {
        email: 'updated@testorg.com',
        phone: '+1987654321',
      },
    };

    it('should update organization successfully', async () => {
      const mockUpdatedOrganization = {
        id: organizationId,
        ...updateParams,
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
        updatedAt: new Date(),
      };

      mockOrganizationRepository.update.mockResolvedValue(mockUpdatedOrganization);

      const result = await organizationService.updateOrganization(organizationId, updateParams);

      expect(result).toEqual(mockUpdatedOrganization);
      expect(mockOrganizationRepository.update).toHaveBeenCalledWith(organizationId, updateParams);
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockUpdatedOrganization,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        name: '', // Invalid empty name
      };

      await expect(organizationService.updateOrganization(organizationId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent organization', async () => {
      mockOrganizationRepository.update.mockRejectedValue(new Error('Organization not found'));

      await expect(organizationService.updateOrganization(organizationId, updateParams))
        .rejects
        .toThrow('Organization not found');
    });
  });

  describe('deleteOrganization', () => {
    const organizationId = 'org123';

    it('should delete organization successfully', async () => {
      const mockDeletedOrganization = {
        id: organizationId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockOrganizationRepository.delete.mockResolvedValue(mockDeletedOrganization);

      const result = await organizationService.deleteOrganization(organizationId);

      expect(result).toEqual(mockDeletedOrganization);
      expect(mockOrganizationRepository.delete).toHaveBeenCalledWith(organizationId);
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockDeletedOrganization,
        'deleted'
      );
    });

    it('should handle non-existent organization', async () => {
      mockOrganizationRepository.delete.mockRejectedValue(new Error('Organization not found'));

      await expect(organizationService.deleteOrganization(organizationId))
        .rejects
        .toThrow('Organization not found');
    });
  });

  describe('getOrganizationSummary', () => {
    it('should return organization summary', async () => {
      const mockOrganizations = [
        {
          id: 'org1',
          type: OrganizationType.BUSINESS,
          status: OrganizationStatus.ACTIVE,
        },
        {
          id: 'org2',
          type: OrganizationType.NONPROFIT,
          status: OrganizationStatus.ACTIVE,
        },
        {
          id: 'org3',
          type: OrganizationType.BUSINESS,
          status: OrganizationStatus.INACTIVE,
        },
      ];

      const mockUsers = [
        { organizationId: 'org1' },
        { organizationId: 'org1' },
        { organizationId: 'org2' },
      ];

      mockOrganizationRepository.find.mockResolvedValue(mockOrganizations);
      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await organizationService.getOrganizationSummary();

      expect(result).toEqual({
        totalOrganizations: 3,
        activeOrganizations: 2,
        inactiveOrganizations: 1,
        organizationsByType: {
          [OrganizationType.BUSINESS]: 2,
          [OrganizationType.NONPROFIT]: 1,
        },
        totalUsers: 3,
        averageUsersPerOrganization: 1.5,
      });
      expect(mockOrganizationRepository.find).toHaveBeenCalled();
      expect(mockUserRepository.find).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockOrganizationRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(organizationService.getOrganizationSummary())
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getOrganizationUsers', () => {
    const organizationId = 'org123';

    it('should return organization users', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          organizationId,
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          organizationId,
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await organizationService.getOrganizationUsers(organizationId);

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith({ organizationId });
    });

    it('should return empty array when organization has no users', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await organizationService.getOrganizationUsers(organizationId);

      expect(result).toEqual([]);
    });
  });

  describe('addUserToOrganization', () => {
    const organizationId = 'org123';
    const userId = 'user123';

    it('should add user to organization successfully', async () => {
      const mockOrganization = {
        id: organizationId,
        name: 'Test Organization',
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
      };

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUpdatedUser = {
        ...mockUser,
        organizationId,
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await organizationService.addUserToOrganization(organizationId, userId);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { organizationId });
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockOrganization,
        'user_added'
      );
    });

    it('should handle non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(organizationService.addUserToOrganization(organizationId, userId))
        .rejects
        .toThrow('Organization not found');
    });

    it('should handle non-existent user', async () => {
      mockOrganizationRepository.findById.mockResolvedValue({
        id: organizationId,
        name: 'Test Organization',
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
      });
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(organizationService.addUserToOrganization(organizationId, userId))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('removeUserFromOrganization', () => {
    const organizationId = 'org123';
    const userId = 'user123';

    it('should remove user from organization successfully', async () => {
      const mockOrganization = {
        id: organizationId,
        name: 'Test Organization',
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
      };

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        organizationId,
      };

      const mockUpdatedUser = {
        ...mockUser,
        organizationId: null,
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findById.mockResolvedValue(mockOrganization);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await organizationService.removeUserFromOrganization(organizationId, userId);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { organizationId: null });
      expect(mockNotificationService.sendOrganizationNotification).toHaveBeenCalledWith(
        mockOrganization,
        'user_removed'
      );
    });

    it('should handle non-existent organization', async () => {
      mockOrganizationRepository.findById.mockResolvedValue(null);

      await expect(organizationService.removeUserFromOrganization(organizationId, userId))
        .rejects
        .toThrow('Organization not found');
    });

    it('should handle non-existent user', async () => {
      mockOrganizationRepository.findById.mockResolvedValue({
        id: organizationId,
        name: 'Test Organization',
        type: OrganizationType.BUSINESS,
        status: OrganizationStatus.ACTIVE,
      });
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(organizationService.removeUserFromOrganization(organizationId, userId))
        .rejects
        .toThrow('User not found');
    });
  });
}); 