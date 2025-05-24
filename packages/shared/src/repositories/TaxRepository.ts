import { Tax, TaxRate, TaxStatus } from '../models/Tax';

export class TaxRepository {
  async create(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<Tax | null> {
    throw new Error('Method not implemented.');
  }

  async find(filters: Partial<Tax>): Promise<Tax[]> {
    throw new Error('Method not implemented.');
  }

  async update(id: string, tax: Partial<Tax>): Promise<Tax> {
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<{ id: string; deleted: boolean; updatedAt: Date }> {
    throw new Error('Method not implemented.');
  }

  async getTaxRates(taxYear: string): Promise<TaxRate[]> {
    throw new Error('Method not implemented.');
  }
} 