import { UserSettings } from '../models/User';
import { firestore } from '../firebase/config';
import { Currency, ExchangeRate, CurrencyConversion } from '../models/Currency';

export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP' | 'UGX' | 'TZS' | 'RWF' | 'ETB';

export interface ExchangeRate {
  currency: Currency;
  rate: number;
  lastUpdated: Date;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private readonly collection = 'exchange_rates';
  private rates: Map<string, ExchangeRate> = new Map();
  private readonly API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  private readonly BASE_CURRENCY: Currency = 'KES';

  private constructor() {
    this.loadRates();
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  private async loadRates(): Promise<void> {
    const snapshot = await firestore.collection(this.collection).get();
    snapshot.docs.forEach(doc => {
      const rate = doc.data() as ExchangeRate;
      this.rates.set(`${rate.from}-${rate.to}`, rate);
    });
  }

  async updateExchangeRate(from: Currency, to: Currency, rate: number): Promise<ExchangeRate> {
    const exchangeRate: ExchangeRate = {
      from,
      to,
      rate,
      lastUpdated: new Date(),
    };

    await firestore
      .collection(this.collection)
      .doc(`${from}-${to}`)
      .set(exchangeRate);

    this.rates.set(`${from}-${to}`, exchangeRate);
    return exchangeRate;
  }

  async getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRate | null> {
    const key = `${from}-${to}`;
    let rate = this.rates.get(key);

    if (!rate) {
      const doc = await firestore.collection(this.collection).doc(key).get();
      if (doc.exists) {
        rate = doc.data() as ExchangeRate;
        this.rates.set(key, rate);
      }
    }

    return rate || null;
  }

  async convertCurrency(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<CurrencyConversion> {
    if (from === to) {
      return {
        amount,
        from,
        to,
        rate: 1,
        convertedAmount: amount,
        timestamp: new Date(),
      };
    }

    const rate = await this.getExchangeRate(from, to);
    if (!rate) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    const convertedAmount = amount * rate.rate;
    return {
      amount,
      from,
      to,
      rate: rate.rate,
      convertedAmount,
      timestamp: new Date(),
    };
  }

  async getLatestRates(base: Currency): Promise<Record<Currency, number>> {
    const rates: Record<Currency, number> = {} as Record<Currency, number>;
    
    for (const currency of Object.values(Currency)) {
      if (currency === base) {
        rates[currency] = 1;
        continue;
      }

      const rate = await this.getExchangeRate(base, currency);
      if (rate) {
        rates[currency] = rate.rate;
      }
    }

    return rates;
  }

  async refreshRates(): Promise<void> {
    // In a real application, this would fetch rates from an external API
    // For now, we'll just reload from Firestore
    await this.loadRates();
  }

  isRateStale(rate: ExchangeRate, maxAgeHours: number = 24): boolean {
    const now = new Date();
    const age = now.getTime() - rate.lastUpdated.getTime();
    return age > maxAgeHours * 60 * 60 * 1000;
  }

  async getStaleRates(maxAgeHours: number = 24): Promise<ExchangeRate[]> {
    const staleRates: ExchangeRate[] = [];
    
    for (const rate of this.rates.values()) {
      if (this.isRateStale(rate, maxAgeHours)) {
        staleRates.push(rate);
      }
    }

    return staleRates;
  }

  async updateExchangeRates(): Promise<void> {
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${this.BASE_CURRENCY}?api_key=${this.API_KEY}`
      );
      const data = await response.json();
      
      Object.entries(data.rates).forEach(([currency, rate]) => {
        if (this.isValidCurrency(currency)) {
          this.rates.set(currency, {
            currency: currency as Currency,
            rate: rate as number,
            lastUpdated: new Date()
          });
        }
      });
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      throw new Error('Failed to update exchange rates');
    }
  }

  async convertAmount(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = this.rates.get(`${fromCurrency}-${toCurrency}`);
    const toRate = this.rates.get(`${toCurrency}-${fromCurrency}`);

    if (!fromRate || !toRate) {
      throw new Error('Exchange rate not available for the specified currencies');
    }

    // Convert to base currency (KES) first, then to target currency
    const amountInKES = amount / fromRate.rate;
    return amountInKES * toRate.rate;
  }

  formatAmount(amount: number, currency: Currency, userSettings?: UserSettings): string {
    const locale = userSettings?.language || 'en-KE';
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    return new Intl.NumberFormat(locale, options).format(amount);
  }

  private isValidCurrency(currency: string): currency is Currency {
    return ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS', 'RWF', 'ETB'].includes(currency);
  }

  getSupportedCurrencies(): Currency[] {
    return Array.from(this.rates.values()).map(rate => rate.currency);
  }
} 