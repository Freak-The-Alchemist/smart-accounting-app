import { User, UserStatus } from '../models/User';
import { ValidationError } from '../utils/errors';

export class UserRepository {
  private users: Map<string, User> = new Map();

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `user-${Date.now()}`;
    const now = new Date();
    
    const newUser: User = {
      ...user,
      id,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async find(filters: Partial<User>): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => {
      return Object.entries(filters).every(([key, value]) => {
        return user[key as keyof User] === value;
      });
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new ValidationError('User not found');
    }

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.find({ email });
    return users[0] || null;
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return this.find({ organizationId });
  }

  async getUsersByStatus(status: UserStatus): Promise<User[]> {
    return this.find({ status });
  }
} 