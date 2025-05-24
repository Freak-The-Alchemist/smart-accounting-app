import { Expense } from '../types/petrolStation';

// In-memory mock data
let expenses: Expense[] = [];

export function getAllExpenses(): Expense[] {
  return [...expenses];
}

export function createExpense(expense: Expense): Expense {
  expenses.push(expense);
  return expense;
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return null;
  expenses[index] = { ...expenses[index], ...updates };
  return expenses[index];
}

export function deleteExpense(id: string): boolean {
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;
  expenses.splice(index, 1);
  return true;
} 