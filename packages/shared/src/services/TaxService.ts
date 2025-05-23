import { Tax, TaxType, TaxStatus, TaxCalculation, TaxSummary } from '../models/Tax';
import { TaxRepository } from '../repositories/TaxRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { NotificationService } from './NotificationService';
import { ValidationError } from '../utils/errors';

export class TaxService {
  constructor(
    private taxRepository: TaxRepository,
    private transactionRepository: TransactionRepository,
    private notificationService: NotificationService
  ) {}

  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    if (tax.amount <= 0) {
      throw new ValidationError('Tax amount must be greater than zero');
    }

    const createdTax = await this.taxRepository.create(tax);
    await this.notificationService.sendTaxNotification(createdTax, 'created');
    return createdTax;
  }

  async getTaxById(id: string): Promise<Tax | null> {
    return this.taxRepository.findById(id);
  }

  async getTaxes(filters: Partial<Tax>): Promise<Tax[]> {
    return this.taxRepository.find(filters);
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const existingTax = await this.taxRepository.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    if (tax.amount !== undefined && tax.amount <= 0) {
      throw new ValidationError('Tax amount must be greater than zero');
    }

    const updatedTax = await this.taxRepository.update(id, tax);
    await this.notificationService.sendTaxNotification(updatedTax, 'updated');
    return updatedTax;
  }

  async deleteTax(id: string): Promise<{ id: string; deleted: boolean; updatedAt: Date }> {
    const existingTax = await this.taxRepository.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    const result = await this.taxRepository.delete(id);
    await this.notificationService.sendTaxNotification(result, 'deleted');
    return result;
  }

  async getTaxSummary(startDate: Date, endDate: Date): Promise<TaxSummary> {
    const taxes = await this.taxRepository.find({
      dueDate: {
        $gte: startDate,
        $lte: endDate,
      } as any, // Type assertion needed for MongoDB-style query
    });

    const totalTaxes = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const paidTaxes = taxes
      .filter(tax => tax.status === TaxStatus.PAID)
      .reduce((sum, tax) => sum + tax.amount, 0);
    const pendingTaxes = taxes
      .filter(tax => tax.status === TaxStatus.PENDING)
      .reduce((sum, tax) => sum + tax.amount, 0);

    const taxesByCategory: Record<string, number> = {};
    const taxesByType: Record<TaxType, number> = {} as Record<TaxType, number>;

    taxes.forEach(tax => {
      taxesByCategory[tax.category] = (taxesByCategory[tax.category] || 0) + 1;
      taxesByType[tax.type] = (taxesByType[tax.type] || 0) + 1;
    });

    return {
      totalTaxes,
      paidTaxes,
      pendingTaxes,
      taxesByCategory,
      taxesByType,
    };
  }

  async calculateTax(income: number, taxYear: string): Promise<TaxCalculation> {
    const taxRates = await this.taxRepository.getTaxRates(taxYear);
    let totalTax = 0;
    let remainingIncome = income;

    for (const bracket of taxRates) {
      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.maxIncome - bracket.minIncome
      );
      if (taxableInBracket > 0) {
        totalTax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
      }
      if (remainingIncome <= 0) break;
    }

    const averageTaxRate = totalTax / income;

    return {
      income,
      taxYear,
      taxAmount: totalTax,
      taxRate: averageTaxRate,
      taxBrackets: taxRates,
    };
  }
} 