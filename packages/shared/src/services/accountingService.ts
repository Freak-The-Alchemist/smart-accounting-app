import { Account, JournalEntry, Expense, ExpenseCategory, ChartOfAccounts } from '../types/accounting';

// In-memory storage for development
let accounts: Account[] = [];
let journalEntries: JournalEntry[] = [];
let expenses: Expense[] = [];
let expenseCategories: ExpenseCategory[] = [];
let chartOfAccounts: ChartOfAccounts[] = [];

export const accountingService = {
  // Account Management
  async getAccounts(): Promise<Account[]> {
    return [...accounts];
  },

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const newAccount: Account = {
      ...account,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    accounts.push(newAccount);
    return newAccount;
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return null;

    accounts[index] = {
      ...accounts[index],
      ...updates,
      updatedAt: new Date(),
    };
    return accounts[index];
  },

  // Journal Entry Management
  async getJournalEntries(): Promise<JournalEntry[]> {
    return [...journalEntries];
  },

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    const newEntry: JournalEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    journalEntries.push(newEntry);
    return newEntry;
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
    const index = journalEntries.findIndex(e => e.id === id);
    if (index === -1) return null;

    journalEntries[index] = {
      ...journalEntries[index],
      ...updates,
      updatedAt: new Date(),
    };
    return journalEntries[index];
  },

  // Expense Management
  async getExpenses(): Promise<Expense[]> {
    return [...expenses];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expenses.push(newExpense);
    return newExpense;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return null;

    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date(),
    };
    return expenses[index];
  },

  // Expense Category Management
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return [...expenseCategories];
  },

  async createExpenseCategory(category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    const newCategory: ExpenseCategory = {
      ...category,
      id: Math.random().toString(36).substr(2, 9),
    };
    expenseCategories.push(newCategory);
    return newCategory;
  },

  // Chart of Accounts Management
  async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    return [...chartOfAccounts];
  },

  async createChartOfAccounts(chart: Omit<ChartOfAccounts, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChartOfAccounts> {
    const newChart: ChartOfAccounts = {
      ...chart,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    chartOfAccounts.push(newChart);
    return newChart;
  },
}; 