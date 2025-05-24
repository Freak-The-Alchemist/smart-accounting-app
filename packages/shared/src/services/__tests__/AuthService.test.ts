import { AuthService } from '../AuthService';
import { User, UserRole } from '../../models/User';
import { AuthRepository } from '../../repositories/AuthRepository';
import { ValidationError } from '../../utils/errors';

// Mock dependencies
jest.mock('../../repositories/AuthRepository');

describe('AuthService', () => {
  let authService: AuthService;
  let mockAuthRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockAuthRepository = new AuthRepository() as jest.Mocked<AuthRepository>;

    // Initialize service with mocked dependencies
    authService = new AuthService(mockAuthRepository);
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      role: UserRole.USER,
    };

    it('should register a new user successfully', async () => {
      const mockCreatedUser = {
        id: 'user123',
        ...validUserData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.createUser.mockResolvedValue(mockCreatedUser);

      const result = await authService.register(validUserData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(validUserData);
    });

    it('should throw ValidationError for invalid user data', async () => {
      const invalidUserData = {
        ...validUserData,
        email: 'invalid-email', // Invalid email format
      };

      await expect(authService.register(invalidUserData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle repository errors', async () => {
      mockAuthRepository.createUser.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(validUserData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: credentials.email,
        displayName: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResult = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      mockAuthRepository.authenticateUser.mockResolvedValue(mockAuthResult);

      const result = await authService.login(credentials);

      expect(result).toEqual(mockAuthResult);
      expect(mockAuthRepository.authenticateUser).toHaveBeenCalledWith(credentials);
    });

    it('should throw ValidationError for invalid credentials', async () => {
      const invalidCredentials = {
        ...credentials,
        email: 'invalid-email', // Invalid email format
      };

      await expect(authService.login(invalidCredentials))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle authentication errors', async () => {
      mockAuthRepository.authenticateUser.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login(credentials))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    const userId = 'user123';

    it('should logout user successfully', async () => {
      mockAuthRepository.logoutUser.mockResolvedValue(true);

      const result = await authService.logout(userId);

      expect(result).toBe(true);
      expect(mockAuthRepository.logoutUser).toHaveBeenCalledWith(userId);
    });

    it('should handle logout errors', async () => {
      mockAuthRepository.logoutUser.mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout(userId))
        .rejects
        .toThrow('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    const userId = 'user123';

    it('should return current user', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.getUserById.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockAuthRepository.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent user', async () => {
      mockAuthRepository.getUserById.mockResolvedValue(null);

      const result = await authService.getCurrentUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    const userId = 'user123';
    const updateData = {
      displayName: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const mockUpdatedUser = {
        id: userId,
        ...updateData,
        role: UserRole.USER,
        updatedAt: new Date(),
      };

      mockAuthRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await authService.updateUser(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockAuthRepository.updateUser).toHaveBeenCalledWith(userId, updateData);
    });

    it('should throw ValidationError for invalid update data', async () => {
      const invalidUpdateData = {
        ...updateData,
        email: 'invalid-email', // Invalid email format
      };

      await expect(authService.updateUser(userId, invalidUpdateData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('changePassword', () => {
    const userId = 'user123';
    const passwordData = {
      currentPassword: 'current123',
      newPassword: 'new123',
    };

    it('should change password successfully', async () => {
      mockAuthRepository.changePassword.mockResolvedValue(true);

      const result = await authService.changePassword(userId, passwordData);

      expect(result).toBe(true);
      expect(mockAuthRepository.changePassword).toHaveBeenCalledWith(userId, passwordData);
    });

    it('should throw ValidationError for invalid password data', async () => {
      const invalidPasswordData = {
        ...passwordData,
        newPassword: 'short', // Password too short
      };

      await expect(authService.changePassword(userId, invalidPasswordData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle password change errors', async () => {
      mockAuthRepository.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      await expect(authService.changePassword(userId, passwordData))
        .rejects
        .toThrow('Current password is incorrect');
    });
  });

  describe('resetPassword', () => {
    const email = 'test@example.com';

    it('should initiate password reset successfully', async () => {
      mockAuthRepository.initiatePasswordReset.mockResolvedValue(true);

      const result = await authService.resetPassword(email);

      expect(result).toBe(true);
      expect(mockAuthRepository.initiatePasswordReset).toHaveBeenCalledWith(email);
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidEmail = 'invalid-email';

      await expect(authService.resetPassword(invalidEmail))
        .rejects
        .toThrow(ValidationError);
    });

    it('should handle reset errors', async () => {
      mockAuthRepository.initiatePasswordReset.mockRejectedValue(new Error('User not found'));

      await expect(authService.resetPassword(email))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('verifyEmail', () => {
    const token = 'verification-token';

    it('should verify email successfully', async () => {
      mockAuthRepository.verifyEmail.mockResolvedValue(true);

      const result = await authService.verifyEmail(token);

      expect(result).toBe(true);
      expect(mockAuthRepository.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should handle verification errors', async () => {
      mockAuthRepository.verifyEmail.mockRejectedValue(new Error('Invalid token'));

      await expect(authService.verifyEmail(token))
        .rejects
        .toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh-token';

    it('should refresh token successfully', async () => {
      const mockAuthResult = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
          role: UserRole.USER,
        },
        token: 'new-jwt-token',
      };

      mockAuthRepository.refreshToken.mockResolvedValue(mockAuthResult);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual(mockAuthResult);
      expect(mockAuthRepository.refreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should handle refresh errors', async () => {
      mockAuthRepository.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(authService.refreshToken(refreshToken))
        .rejects
        .toThrow('Invalid refresh token');
    });
  });
}); 