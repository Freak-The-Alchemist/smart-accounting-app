export type CurrencyCode = 'KES' | 'USD' | 'EUR' | 'GBP' | 'TZS' | 'UGX';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isDefault: boolean;
  exchangeRate?: number;
  lastUpdated?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyExchangeRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  lastUpdated: Date;
  source: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencySummary {
  total: number;
  byCurrency: Partial<Record<CurrencyCode, {
    total: number;
    count: number;
  }>>;
  exchangeRates: Record<string, number>;
}

export interface CurrencyFilters {
  code?: CurrencyCode;
  isActive?: boolean;
  search?: string;
}

export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP' | 'TZS' | 'UGX';

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  lastUpdated: Date;
}

export interface CurrencyConversion {
  amount: number;
  from: Currency;
  to: Currency;
  rate: number;
  convertedAmount: number;
  timestamp: Date;
}

export const SUPPORTED_CURRENCIES: Currency[] = ['KES', 'USD', 'EUR', 'GBP', 'TZS', 'UGX'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  KES: 'KSh',
  USD: '$',
  EUR: '€',
  GBP: '£',
  TZS: 'TSh',
  UGX: 'USh',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  KES: 'Kenyan Shilling',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TZS: 'Tanzanian Shilling',
  UGX: 'Ugandan Shilling',
};

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  }).format(amount);
}

export function parseCurrencyAmount(amount: string, currency: Currency): number {
  const cleanAmount = amount.replace(/[^0-9.-]/g, '');
  return parseFloat(cleanAmount);
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number
): CurrencyConversion {
  const convertedAmount = amount * rate;
  
  return {
    amount,
    from,
    to,
    rate,
    convertedAmount,
    timestamp: new Date(),
  };
}

export function validateCurrency(currency: string): currency is Currency {
  return SUPPORTED_CURRENCIES.includes(currency as Currency);
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency];
}

export function getCurrencyName(currency: Currency): string {
  return CURRENCY_NAMES[currency];
} 