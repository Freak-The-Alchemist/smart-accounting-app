import { User, UserStatus } from '../models/User';
import { ValidationError } from '../utils/errors';
import { hash, compare } from 'bcrypt';

export class AuthRepository {
  private users: Map<string, User> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();

  async register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const id = `user-${Date.now()}`;
    const now = new Date();
    const hashedPassword = await hash(userData.password, 10);
    
    const newUser: User = {
      ...userData,
      id,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async login(email: string, password: string): Promise<{ user: User; refreshToken: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid credentials');
    }

    const refreshToken = await this.generateRefreshToken(user.id);
    return { user, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Remove all refresh tokens for this user
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    return users.find(user => user.email === email) || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new ValidationError('User not found');
    }

    if (data.password) {
      data.password = await hash(data.password, 10);
    }

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyRefreshToken(token: string): Promise<User | null> {
    const tokenData = this.refreshTokens.get(token);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return null;
    }

    return this.findById(tokenData.userId);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    this.refreshTokens.set(token, { userId, expiresAt });
    return token;
  }
} 