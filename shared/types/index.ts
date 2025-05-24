// Basic types for the Smart Accounting App

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  category: string;
  type: 'income' | 'expense';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  userId: string;
  imageUrl: string;
  amount: number;
  date: Date;
  merchant: string;
  items: ReceiptItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  quantity: number;
}

export type TransactionType = 'income' | 'expense';
export type Currency = 'USD' | 'EUR' | 'GBP'; 