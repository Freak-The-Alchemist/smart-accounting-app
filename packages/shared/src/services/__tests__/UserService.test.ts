import { UserService } from '../UserService';
import { User, UserRole, UserStatus } from '../../models/User';
import { UserRepository } from '../../repositories/UserRepository';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import { NotificationService } from '../NotificationService';
import { ValidationError, AuthenticationError } from '../../utils/errors';
import { hashPassword, comparePasswords } from '../../utils/auth';

// Mock dependencies
jest.mock('../../repositories/UserRepository');
jest.mock('../../repositories/OrganizationRepository');
jest.mock('../NotificationService');
jest.mock('../../utils/auth');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockOrganizationRepository: jest.Mocked<OrganizationRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockOrganizationRepository = new OrganizationRepository() as jest.Mocked<OrganizationRepository>;
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

    // Initialize service with mocked dependencies
    userService = new UserService(
      mockUserRepository,
      mockOrganizationRepository,
      mockNotificationService
    );
  });

  describe('createUser', () => {
    const userParams = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      organizationId: 'org123',
    };

    it('should create user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user123',
        ...userParams,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(userParams);

      expect(result).toEqual(mockUser);
      expect(hashPassword).toHaveBeenCalledWith(userParams.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userParams,
        password: hashedPassword,
      });
      expect(mockNotificationService.sendUserNotification).toHaveBeenCalledWith(
        mockUser,
        'created'
      );
    });

    it('should throw ValidationError for invalid user parameters', async () => {
      const invalidParams = {
        ...userParams,
        email: 'invalid-email',
      };

      await expect(userService.createUser(invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(userParams))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getUserById', () => {
    const userId = 'user123';

    it('should return user by id', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('getUsers', () => {
    const filters = {
      organizationId: 'org123',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    };

    it('should return filtered users', async () => {
      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await userService.getUsers(filters);

      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no users match filters', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await userService.getUsers(filters);

      expect(result).toEqual([]);
    });
  });

  describe('updateUser', () => {
    const userId = 'user123';
    const updateParams = {
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.ADMIN,
    };

    it('should update user successfully', async () => {
      const mockUpdatedUser = {
        id: userId,
        ...updateParams,
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(userId, updateParams);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateParams);
      expect(mockNotificationService.sendUserNotification).toHaveBeenCalledWith(
        mockUpdatedUser,
        'updated'
      );
    });

    it('should throw ValidationError for invalid update parameters', async () => {
      const invalidParams = {
        ...updateParams,
        role: 'INVALID_ROLE' as UserRole,
      };

      await expect(userService.updateUser(userId, invalidParams))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle non-existent user', async () => {
      mockUserRepository.update.mockRejectedValue(new Error('User not found'));

      await expect(userService.updateUser(userId, updateParams))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    const userId = 'user123';

    it('should delete user successfully', async () => {
      const mockDeletedUser = {
        id: userId,
        deleted: true,
        updatedAt: new Date(),
      };

      mockUserRepository.delete.mockResolvedValue(mockDeletedUser);

      const result = await userService.deleteUser(userId);

      expect(result).toEqual(mockDeletedUser);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockNotificationService.sendUserNotification).toHaveBeenCalledWith(
        mockDeletedUser,
        'deleted'
      );
    });

    it('should handle non-existent user', async () => {
      mockUserRepository.delete.mockRejectedValue(new Error('User not found'));

      await expect(userService.deleteUser(userId))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('authenticateUser', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should authenticate user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user123',
        email: credentials.email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (comparePasswords as jest.Mock).mockResolvedValue(true);

      const result = await userService.authenticateUser(credentials);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(comparePasswords).toHaveBeenCalledWith(credentials.password, hashedPassword);
    });

    it('should throw AuthenticationError for invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.authenticateUser(credentials))
        .rejects
        .toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for incorrect password', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user123',
        email: credentials.email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (comparePasswords as jest.Mock).mockResolvedValue(false);

      await expect(userService.authenticateUser(credentials))
        .rejects
        .toThrow(AuthenticationError);
    });
  });

  describe('changePassword', () => {
    const userId = 'user123';
    const passwordParams = {
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      const hashedCurrentPassword = 'hashedCurrentPassword123';
      const hashedNewPassword = 'hashedNewPassword123';
      const mockUser = {
        id: userId,
        password: hashedCurrentPassword,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      (comparePasswords as jest.Mock).mockResolvedValue(true);
      (hashPassword as jest.Mock).mockResolvedValue(hashedNewPassword);

      const mockUpdatedUser = {
        id: userId,
        password: hashedNewPassword,
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.changePassword(userId, passwordParams);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(comparePasswords).toHaveBeenCalledWith(passwordParams.currentPassword, hashedCurrentPassword);
      expect(hashPassword).toHaveBeenCalledWith(passwordParams.newPassword);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { password: hashedNewPassword });
      expect(mockNotificationService.sendUserNotification).toHaveBeenCalledWith(
        mockUpdatedUser,
        'password_changed'
      );
    });

    it('should throw AuthenticationError for incorrect current password', async () => {
      const hashedCurrentPassword = 'hashedCurrentPassword123';
      const mockUser = {
        id: userId,
        password: hashedCurrentPassword,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      (comparePasswords as jest.Mock).mockResolvedValue(false);

      await expect(userService.changePassword(userId, passwordParams))
        .rejects
        .toThrow(AuthenticationError);
    });

    it('should handle non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.changePassword(userId, passwordParams))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    const email = 'test@example.com';

    it('should reset password successfully', async () => {
      const hashedNewPassword = 'hashedNewPassword123';
      const mockUser = {
        id: 'user123',
        email,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue(hashedNewPassword);

      const mockUpdatedUser = {
        id: 'user123',
        password: hashedNewPassword,
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.resetPassword(email);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(hashPassword).toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockNotificationService.sendUserNotification).toHaveBeenCalledWith(
        mockUpdatedUser,
        'password_reset'
      );
    });

    it('should handle non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.resetPassword(email))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('getUserSummary', () => {
    const organizationId = 'org123';

    it('should return user summary', async () => {
      const mockUsers = [
        {
          id: 'user1',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          id: 'user2',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
        {
          id: 'user3',
          role: UserRole.USER,
          status: UserStatus.INACTIVE,
        },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await userService.getUserSummary(organizationId);

      expect(result).toEqual({
        totalUsers: 3,
        activeUsers: 2,
        inactiveUsers: 1,
        usersByRole: {
          [UserRole.ADMIN]: 1,
          [UserRole.USER]: 2,
        },
      });
      expect(mockUserRepository.find).toHaveBeenCalledWith({ organizationId });
    });

    it('should handle repository errors', async () => {
      mockUserRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserSummary(organizationId))
        .rejects
        .toThrow('Database error');
    });
  });
}); 