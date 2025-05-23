import { Expense } from "../types/petrolStation";

export const createExpense = (expense: Expense) => {
  console.log('Creating expense:', expense);
  // TODO: Implement Firebase Firestore integration
};

export const getExpenses = async (): Promise<Expense[]> => {
  console.log('Getting expenses');
  // TODO: Implement Firebase Firestore integration
  return [];
};

export const updateExpense = (expenseId: string, updates: Partial<Expense>) => {
  console.log(`Updating expense ${expenseId} with:`, updates);
  // TODO: Implement Firebase Firestore integration
};

export const deleteExpense = (expenseId: string) => {
  console.log('Deleting expense:', expenseId);
  // TODO: Implement Firebase Firestore integration
}; 