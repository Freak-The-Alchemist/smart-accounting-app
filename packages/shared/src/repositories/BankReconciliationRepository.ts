import { BankReconciliation, BankReconciliationStatus } from '../models/BankReconciliation';
import { ValidationError } from '../utils/errors';

export class BankReconciliationRepository {
  private reconciliations: Map<string, BankReconciliation> = new Map();

  async create(reconciliation: Omit<BankReconciliation, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankReconciliation> {
    const id = `bank-reconciliation-${Date.now()}`;
    const now = new Date();
    
    const newReconciliation: BankReconciliation = {
      ...reconciliation,
      id,
      status: BankReconciliationStatus.PENDING,
      createdAt: now,
      updatedAt: now
    };

    this.reconciliations.set(id, newReconciliation);
    return newReconciliation;
  }

  async findById(id: string): Promise<BankReconciliation | null> {
    return this.reconciliations.get(id) || null;
  }

  async find(filters: Partial<BankReconciliation>): Promise<BankReconciliation[]> {
    return Array.from(this.reconciliations.values()).filter(reconciliation => {
      return Object.entries(filters).every(([key, value]) => {
        return reconciliation[key as keyof BankReconciliation] === value;
      });
    });
  }

  async update(id: string, data: Partial<BankReconciliation>): Promise<BankReconciliation> {
    const reconciliation = await this.findById(id);
    if (!reconciliation) {
      throw new ValidationError('Bank reconciliation not found');
    }

    const updatedReconciliation = {
      ...reconciliation,
      ...data,
      updatedAt: new Date()
    };

    this.reconciliations.set(id, updatedReconciliation);
    return updatedReconciliation;
  }

  async delete(id: string): Promise<boolean> {
    return this.reconciliations.delete(id);
  }

  async getReconciliationsByAccount(accountId: string): Promise<BankReconciliation[]> {
    return this.find({ accountId });
  }

  async getReconciliationsByStatus(status: BankReconciliationStatus): Promise<BankReconciliation[]> {
    return this.find({ status });
  }

  async getReconciliationSummary(organizationId: string): Promise<{
    totalReconciliations: number;
    reconciliationsByStatus: Record<BankReconciliationStatus, number>;
  }> {
    const reconciliations = await this.find({ organizationId });
    
    const summary = {
      totalReconciliations: reconciliations.length,
      reconciliationsByStatus: {} as Record<BankReconciliationStatus, number>
    };

    reconciliations.forEach(reconciliation => {
      summary.reconciliationsByStatus[reconciliation.status] = 
        (summary.reconciliationsByStatus[reconciliation.status] || 0) + 1;
    });

    return summary;
  }
} 