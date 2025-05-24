import { Tax, TaxRate, TaxStatus, taxValidationRules } from '../models/Tax';
import { ValidationError } from '../utils/errors';

export class TaxRepository {
  private taxes: Map<string, Tax> = new Map();
  private taxRates: Map<string, TaxRate[]> = new Map();

  async create(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    // Validate tax data
    this.validateTax(tax);

    const id = `tax_${Date.now()}`;
    const now = new Date();
    const newTax: Tax = {
      ...tax,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.taxes.set(id, newTax);
    return newTax;
  }

  async findById(id: string): Promise<Tax | null> {
    return this.taxes.get(id) || null;
  }

  async find(filters: Partial<Tax>): Promise<Tax[]> {
    return Array.from(this.taxes.values()).filter(tax => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'dueDate' && typeof value === 'object' && value !== null) {
          const dueDate = tax.dueDate;
          if ('$gte' in value && dueDate < value.$gte) return false;
          if ('$lte' in value && dueDate > value.$lte) return false;
          return true;
        }
        return tax[key as keyof Tax] === value;
      });
    });
  }

  async update(id: string, tax: Partial<Tax>): Promise<Tax> {
    const existingTax = await this.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    // Validate updated tax data
    this.validateTax({ ...existingTax, ...tax });

    const updatedTax: Tax = {
      ...existingTax,
      ...tax,
      updatedAt: new Date(),
    };

    this.taxes.set(id, updatedTax);
    return updatedTax;
  }

  async delete(id: string): Promise<{ id: string; deleted: boolean; updatedAt: Date }> {
    const existingTax = await this.findById(id);
    if (!existingTax) {
      throw new Error('Tax not found');
    }

    this.taxes.delete(id);
    return {
      id,
      deleted: true,
      updatedAt: new Date(),
    };
  }

  async getTaxRates(taxYear: string): Promise<TaxRate[]> {
    const rates = this.taxRates.get(taxYear);
    if (!rates) {
      // Return default tax rates if none exist for the year
      return [
        {
          id: 'rate1',
          rate: 0.1,
          type: 'PERCENTAGE',
          effectiveFrom: new Date(`${taxYear}-01-01`),
          currency: 'USD',
        },
        {
          id: 'rate2',
          rate: 0.2,
          type: 'PERCENTAGE',
          effectiveFrom: new Date(`${taxYear}-01-01`),
          currency: 'USD',
        },
      ];
    }
    return rates;
  }

  private validateTax(tax: Partial<Tax>): void {
    // Validate required fields
    if (tax.code && !taxValidationRules.code.pattern.test(tax.code)) {
      throw new ValidationError('Invalid tax code format');
    }

    if (tax.name && (tax.name.length < taxValidationRules.name.minLength || 
        tax.name.length > taxValidationRules.name.maxLength)) {
      throw new ValidationError('Invalid tax name length');
    }

    if (tax.type && !Object.values(TaxStatus).includes(tax.type as TaxStatus)) {
      throw new ValidationError('Invalid tax type');
    }

    if (tax.status && !Object.values(TaxStatus).includes(tax.status)) {
      throw new ValidationError('Invalid tax status');
    }

    // Validate rates if present
    if (tax.rates) {
      if (!Array.isArray(tax.rates) || tax.rates.length === 0) {
        throw new ValidationError('Tax must have at least one rate');
      }

      tax.rates.forEach(rate => {
        if (!rate.id || rate.rate < 0 || !rate.type || !rate.effectiveFrom || !rate.currency) {
          throw new ValidationError('Invalid tax rate configuration');
        }
      });
    }
  }
} 