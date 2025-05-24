import { User } from './auth';

export type FuelType = 'petrol' | 'diesel' | 'lpg';
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'bank';
export type ShiftStatus = 'active' | 'completed' | 'cancelled';
export type ExpenseCategory = 'fuel' | 'maintenance' | 'utilities' | 'supplies' | 'salary' | 'rent' | 'insurance' | 'taxes' | 'marketing' | 'other';
export type StockCategory = 'fuel' | 'shop' | 'spare_parts' | 'other';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  LPG: 'lpg'
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile',
  BANK: 'bank'
} as const;

export const SHIFT_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const EXPENSE_CATEGORIES = {
  FUEL: 'fuel',
  MAINTENANCE: 'maintenance',
  UTILITIES: 'utilities',
  SUPPLIES: 'supplies',
  SALARY: 'salary',
  RENT: 'rent',
  INSURANCE: 'insurance',
  TAXES: 'taxes',
  MARKETING: 'marketing',
  OTHER: 'other'
} as const;

export const STOCK_CATEGORIES = {
  FUEL: 'fuel',
  SHOP: 'shop',
  SPARE_PARTS: 'spare_parts',
  OTHER: 'other'
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export interface FuelSale {
  id: string;
  stationId: string;
  shiftId: string;
  fuelType: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  timestamp: Date;
  paymentMethod: 'cash' | 'card' | 'mobile';
  notes?: string;
}

export interface Shift {
  id: string;
  stationId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  openingCash: number;
  closingCash?: number;
  notes?: string;
}

export interface Expense {
  id: string;
  stationId: string;
  shiftId?: string;
  category: string;
  amount: number;
  description: string;
  timestamp: Date;
  receiptUrl?: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  notes?: string;
}

export interface StockItem {
  id: string;
  stationId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  reorderPoint: number;
  lastRestocked?: Date;
  notes?: string;
}

export interface DailyReport {
  id: string;
  date: Date;
  totalFuelSales: number;
  totalExpenses: number;
  netIncome: number;
  fuelSalesByType: Record<FuelType, number>;
  expensesByCategory: Record<Expense['category'], number>;
  shifts: string[]; // Array of shift IDs
  generatedBy: string; // User ID
  generatedAt: Date;
}

export interface MonthlyReport {
  id: string;
  year: number;
  month: number;
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  fuelSales: {
    petrol: {
      liters: number;
      amount: number;
    };
    diesel: {
      liters: number;
      amount: number;
    };
    cng: {
      liters: number;
      amount: number;
    };
  };
  expenses: {
    fuel: number;
    maintenance: number;
    utilities: number;
    supplies: number;
    other: number;
  };
  paymentMethods: {
    cash: number;
    card: number;
    mobile: number;
    bank: number;
  };
  dailyReports: string[]; // Array of daily report IDs
  recordedBy: string;
}

export interface PetrolStation {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  fuelTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    currency: string;
    timezone: string;
    lowStockThreshold: number;
  };
}

export interface StationSettings {
  fuelTypes: FuelType[];
  paymentMethods: PaymentMethod[];
  expenseCategories: ExpenseCategory[];
  stockCategories: StockCategory[];
  currency: string;
  timezone: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ATTENDANT = 'ATTENDANT',
  ACCOUNTANT = 'ACCOUNTANT'
} 