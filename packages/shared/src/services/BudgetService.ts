import { firestore } from '../firebase/config';
import { Budget, BudgetSummary, BudgetStatus } from '../models/Budget';
import { Transaction } from '../models/Transaction';

export class BudgetService {
  private static instance: BudgetService;
  private readonly collection = 'budgets';

  private constructor() {}

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    const now = new Date();
    
    const newBudget: Budget = {
      ...budget,
      id: firestore.collection(this.collection).doc().id,
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection(this.collection).doc(newBudget.id).set(newBudget);
    return newBudget;
  }

  async getBudget(id: string): Promise<Budget | null> {
    const doc = await firestore.collection(this.collection).doc(id).get();
    return doc.exists ? (doc.data() as Budget) : null;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const budgetRef = firestore.collection(this.collection).doc(id);
    const doc = await budgetRef.get();

    if (!doc.exists) {
      throw new Error('Budget not found');
    }

    const updatedBudget = {
      ...updates,
      updatedAt: new Date(),
    };

    await budgetRef.update(updatedBudget);
    return { ...doc.data() as Budget, ...updatedBudget };
  }

  async deleteBudget(id: string): Promise<void> {
    await firestore.collection(this.collection).doc(id).delete();
  }

  async listBudgets(filters?: {
    status?: BudgetStatus;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<Budget[]> {
    let query = firestore.collection(this.collection);

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.startDate) {
      query = query.where('startDate', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('endDate', '<=', filters.endDate);
    }

    if (filters?.userId) {
      query = query.where('createdBy', '==', filters.userId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as Budget);
  }

  async getBudgetSummary(userId: string): Promise<BudgetSummary> {
    const budgets = await this.listBudgets({ userId });
    const summary: BudgetSummary = {
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      byCategory: {},
      byPeriod: {},
      statusBreakdown: {
        on_track: 0,
        at_risk: 0,
        exceeded: 0,
      },
    };

    budgets.forEach(budget => {
      // Update totals
      summary.totalBudgeted += budget.totalAmount;
      summary.totalSpent += budget.totalSpent;
      summary.totalRemaining += budget.totalRemaining;

      // Update category breakdown
      budget.categories.forEach(category => {
        if (!summary.byCategory[category.id]) {
          summary.byCategory[category.id] = {
            name: category.name,
            budgeted: 0,
            spent: 0,
            remaining: 0,
            status: category.status,
          };
        }
        summary.byCategory[category.id].budgeted += category.amount;
        summary.byCategory[category.id].spent += category.spent;
        summary.byCategory[category.id].remaining += category.remaining;
      });

      // Update period breakdown
      const period = budget.period;
      if (!summary.byPeriod[period]) {
        summary.byPeriod[period] = {
          budgeted: 0,
          spent: 0,
          remaining: 0,
        };
      }
      summary.byPeriod[period].budgeted += budget.totalAmount;
      summary.byPeriod[period].spent += budget.totalSpent;
      summary.byPeriod[period].remaining += budget.totalRemaining;

      // Update status breakdown
      summary.statusBreakdown[budget.status]++;
    });

    return summary;
  }

  async updateBudgetStatus(id: string): Promise<Budget> {
    const budget = await this.getBudget(id);
    if (!budget) {
      throw new Error('Budget not found');
    }

    let newStatus: BudgetStatus = 'on_track';
    const spentPercentage = (budget.totalSpent / budget.totalAmount) * 100;

    if (spentPercentage >= 100) {
      newStatus = 'exceeded';
    } else if (spentPercentage >= budget.notifications.threshold) {
      newStatus = 'at_risk';
    }

    return this.updateBudget(id, { status: newStatus });
  }

  async addTransactionToBudget(budgetId: string, transaction: Transaction): Promise<Budget> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    const category = budget.categories.find(c => c.id === transaction.categoryId);
    if (!category) {
      throw new Error('Category not found in budget');
    }

    category.spent += transaction.amount;
    category.remaining = category.amount - category.spent;
    category.transactions.push(transaction.id);

    // Update category status
    const spentPercentage = (category.spent / category.amount) * 100;
    if (spentPercentage >= 100) {
      category.status = 'exceeded';
    } else if (spentPercentage >= budget.notifications.threshold) {
      category.status = 'at_risk';
    } else {
      category.status = 'on_track';
    }

    // Update budget totals
    budget.totalSpent += transaction.amount;
    budget.totalRemaining = budget.totalAmount - budget.totalSpent;

    return this.updateBudget(budgetId, {
      categories: budget.categories,
      totalSpent: budget.totalSpent,
      totalRemaining: budget.totalRemaining,
    });
  }
} 