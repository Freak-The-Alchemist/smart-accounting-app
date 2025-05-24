import { Account, AccountType, AccountStatus } from '../models/Account';
import { ValidationError } from '../utils/errors';

export class AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const id = `account-${Date.now()}`;
    const now = new Date();
    
    const newAccount: Account = {
      ...account,
      id,
      status: AccountStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    };

    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) || null;
  }

  async find(filters: Partial<Account>): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => {
      return Object.entries(filters).every(([key, value]) => {
        return account[key as keyof Account] === value;
      });
    });
  }

  async update(id: string, data: Partial<Account>): Promise<Account> {
    const account = await this.findById(id);
    if (!account) {
      throw new ValidationError('Account not found');
    }

    const updatedAccount = {
      ...account,
      ...data,
      updatedAt: new Date()
    };

    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async delete(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  async getAccountsByOrganization(organizationId: string): Promise<Account[]> {
    return this.find({ organizationId });
  }

  async getAccountsByType(type: AccountType): Promise<Account[]> {
    return this.find({ type });
  }

  async getAccountsByStatus(status: AccountStatus): Promise<Account[]> {
    return this.find({ status });
  }

  async getAccountSummary(organizationId: string): Promise<{
    totalAccounts: number;
    accountsByType: Record<AccountType, number>;
    accountsByStatus: Record<AccountStatus, number>;
  }> {
    const accounts = await this.getAccountsByOrganization(organizationId);
    
    const summary = {
      totalAccounts: accounts.length,
      accountsByType: {} as Record<AccountType, number>,
      accountsByStatus: {} as Record<AccountStatus, number>
    };

    accounts.forEach(account => {
      summary.accountsByType[account.type] = 
        (summary.accountsByType[account.type] || 0) + 1;
      summary.accountsByStatus[account.status] = 
        (summary.accountsByStatus[account.status] || 0) + 1;
    });

    return summary;
  }
} 