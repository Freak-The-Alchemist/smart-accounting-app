import { Reconciliation, ReconciliationStatus } from '../models/Reconciliation';
import { ValidationError } from '../utils/errors';

export class ReconciliationRepository {
  private reconciliations: Map<string, Reconciliation> = new Map();

  async create(reconciliation: Omit<Reconciliation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reconciliation> {
    const id = `reconciliation-${Date.now()}`;
    const now = new Date();
    
    const newReconciliation: Reconciliation = {
      ...reconciliation,
      id,
      status: ReconciliationStatus.PENDING,
      createdAt: now,
      updatedAt: now
    };

    this.reconciliations.set(id, newReconciliation);
    return newReconciliation;
  }

  async findById(id: string): Promise<Reconciliation | null> {
    return this.reconciliations.get(id) || null;
  }

  async find(filters: Partial<Reconciliation>): Promise<Reconciliation[]> {
    return Array.from(this.reconciliations.values()).filter(reconciliation => {
      return Object.entries(filters).every(([key, value]) => {
        return reconciliation[key as keyof Reconciliation] === value;
      });
    });
  }

  async update(id: string, data: Partial<Reconciliation>): Promise<Reconciliation> {
    const reconciliation = await this.findById(id);
    if (!reconciliation) {
      throw new ValidationError('Reconciliation not found');
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

  async getReconciliationSummary(organizationId: string, period: { startDate: Date; endDate: Date }): Promise<{
    totalReconciliations: number;
    reconciliationsByStatus: Record<ReconciliationStatus, number>;
  }> {
    const reconciliations = await this.find({
      organizationId,
      createdAt: period.startDate
    });

    const summary = {
      totalReconciliations: reconciliations.length,
      reconciliationsByStatus: {} as Record<ReconciliationStatus, number>
    };

    reconciliations.forEach(reconciliation => {
      summary.reconciliationsByStatus[reconciliation.status] = 
        (summary.reconciliationsByStatus[reconciliation.status] || 0) + 1;
    });

    return summary;
  }
} 