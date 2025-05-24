import { Tax, TaxType, TaxStatus, TaxCalculationType, TaxSummary, TaxFilters } from '../models/Tax';
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
    // Validate tax rates
    if (!tax.rates || tax.rates.length === 0) {
      throw new ValidationError('Tax must have at least one rate');
    }

    // Validate each rate
    for (const rate of tax.rates) {
      if (rate.rate < 0) {
        throw new ValidationError('Tax rate cannot be negative');
      }
      if (!rate.type || !Object.values(TaxCalculationType).includes(rate.type)) {
        throw new ValidationError('Invalid tax calculation type');
      }
    }

    const createdTax = await this.taxRepository.create(tax);
    await this.notificationService.sendTaxNotification(createdTax, 'created');
    return createdTax;
  }

  async getTaxById(id: string): Promise<Tax | null> {
    return this.taxRepository.findById(id);
  }

  async getTaxes(filters: TaxFilters): Promise<Tax[]> {
    return this.taxRepository.find(filters);
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const existingTax = await this.taxRepository.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    // Validate rates if provided
    if (tax.rates) {
      for (const rate of tax.rates) {
        if (rate.rate < 0) {
          throw new ValidationError('Tax rate cannot be negative');
        }
        if (!rate.type || !Object.values(TaxCalculationType).includes(rate.type)) {
          throw new ValidationError('Invalid tax calculation type');
        }
      }
    }

    const updatedTax = await this.taxRepository.update(id, tax);
    await this.notificationService.sendTaxNotification(updatedTax, 'updated');
    return updatedTax;
  }

  async deleteTax(id: string): Promise<boolean> {
    const existingTax = await this.taxRepository.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    const result = await this.taxRepository.delete(id);
    await this.notificationService.sendTaxNotification(
      { id, deleted: true, updatedAt: new Date() },
      'deleted'
    );
    return result;
  }

  async getTaxSummary(organizationId: string, dateRange: { startDate: Date; endDate: Date }): Promise<TaxSummary> {
    const taxes = await this.taxRepository.find({
      organizationId,
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    });

    const totalAmount = taxes.reduce((sum, tax) => {
      const currentRate = tax.rates.find(rate => 
        rate.effectiveFrom <= new Date() && (!rate.effectiveTo || rate.effectiveTo >= new Date())
      );
      return sum + (currentRate?.rate || 0);
    }, 0);

    const paidAmount = taxes.reduce((sum, tax) => {
      const paidPayments = tax.payments?.filter(payment => payment.status === 'PAID') || [];
      return sum + paidPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);

    const pendingAmount = totalAmount - paidAmount;

    return {
      totalTaxes: taxes.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      taxes
    };
  }

  async calculateTax(amount: number, taxYear: number): Promise<{
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
  }> {
    const taxRates = await this.taxRepository.getTaxRates(taxYear);
    if (!taxRates || taxRates.length === 0) {
      throw new Error('No tax rates found for the specified year');
    }

    const currentRate = taxRates.find(rate => 
      rate.effectiveFrom <= new Date() && (!rate.effectiveTo || rate.effectiveTo >= new Date())
    );

    if (!currentRate) {
      throw new Error('No valid tax rate found for the current date');
    }

    const taxAmount = amount * (currentRate.rate / 100);
    const taxRate = currentRate.rate;

    return {
      taxableAmount: amount,
      taxAmount,
      taxRate
    };
  }
} 