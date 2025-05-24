export const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  CNG: 'cng',
  LPG: 'lpg',
} as const;

export const FUEL_UNITS = {
  LITERS: 'liters',
  KILOGRAMS: 'kg',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile',
} as const;

export const EXPENSE_CATEGORIES = {
  FUEL: 'fuel',
  MAINTENANCE: 'maintenance',
  UTILITIES: 'utilities',
  SUPPLIES: 'supplies',
  SALARY: 'salary',
  RENT: 'rent',
  OTHER: 'other',
} as const;

export const SHIFT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const EXPENSE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ATTENDANT: 'attendant',
} as const; 