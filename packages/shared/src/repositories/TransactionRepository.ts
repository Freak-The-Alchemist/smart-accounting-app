import { Transaction } from '../models/Transaction';

export class TransactionRepository {
  async find(filters: Partial<Transaction>): Promise<Transaction[]> {
    throw new Error('Method not implemented.');
  }
} 