import { 
  where, 
  orderBy, 
  startAt, 
  endAt,
  QueryConstraint 
} from 'firebase/firestore';
import { BaseService } from './BaseService';
import { Transaction, TransactionType, TransactionSummary, TransactionFilters } from '../models/Transaction';
import { Currency } from '../models/Currency';
import { firestore } from '../firebase/config';

export class TransactionService extends BaseService<Transaction> {
  private static instance: TransactionService;
  private readonly collection = 'transactions';

  private constructor() {
    super('transactions');
  }

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: TransactionType
  ): Promise<Transaction[]> {
    const constraints: QueryConstraint[] = [
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    ];

    if (type) {
      constraints.push(where('type', '==', type));
    }

    return this.getByUserId(userId, constraints);
  }

  async getTransactionsByCategory(
    userId: string,
    category: string,
    type?: TransactionType
  ): Promise<Transaction[]> {
    const constraints: QueryConstraint[] = [
      where('category', '==', category),
      orderBy('date', 'desc')
    ];

    if (type) {
      constraints.push(where('type', '==', type));
    }

    return this.getByUserId(userId, constraints);
  }

  async getTransactionSummary(userId: string, startDate?: Date, endDate?: Date): Promise<TransactionSummary> {
    const transactions = await this.listTransactions({
      startDate,
      endDate,
    });

    const summary: TransactionSummary = {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      byCategory: {},
      byMonth: {},
      byCurrency: {} as Record<Currency, { income: number; expenses: number; net: number }>,
    };

    // Initialize currency records
    Object.values(Currency).forEach(currency => {
      summary.byCurrency[currency] = { income: 0, expenses: 0, net: 0 };
    });

    transactions.forEach(transaction => {
      const month = transaction.date.toISOString().slice(0, 7);

      // Update totals
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
        summary.byCurrency[transaction.currency].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        summary.totalExpenses += transaction.amount;
        summary.byCurrency[transaction.currency].expenses += transaction.amount;
      }

      // Update category breakdown
      const categoryId = transaction.category.id;
      if (!summary.byCategory[categoryId]) {
        summary.byCategory[categoryId] = {
          name: transaction.category.name,
          type: transaction.type,
          total: 0,
          count: 0,
        };
      }
      summary.byCategory[categoryId].total += transaction.amount;
      summary.byCategory[categoryId].count++;

      // Update monthly breakdown
      if (!summary.byMonth[month]) {
        summary.byMonth[month] = { income: 0, expenses: 0, net: 0 };
      }
      if (transaction.type === 'income') {
        summary.byMonth[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        summary.byMonth[month].expenses += transaction.amount;
      }
      summary.byMonth[month].net = summary.byMonth[month].income - summary.byMonth[month].expenses;
    });

    // Calculate net amounts
    summary.netAmount = summary.totalIncome - summary.totalExpenses;
    Object.values(Currency).forEach(currency => {
      summary.byCurrency[currency].net = 
        summary.byCurrency[currency].income - summary.byCurrency[currency].expenses;
    });

    return summary;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const now = new Date();
    
    const newTransaction: Transaction = {
      ...transaction,
      id: firestore.collection(this.collection).doc().id,
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection(this.collection).doc(newTransaction.id).set(newTransaction);
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const doc = await firestore.collection(this.collection).doc(id).get();
    return doc.exists ? (doc.data() as Transaction) : null;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const transactionRef = firestore.collection(this.collection).doc(id);
    const doc = await transactionRef.get();

    if (!doc.exists) {
      throw new Error('Transaction not found');
    }

    const updatedTransaction = {
      ...updates,
      updatedAt: new Date(),
    };

    await transactionRef.update(updatedTransaction);
    return { ...doc.data() as Transaction, ...updatedTransaction };
  }

  async deleteTransaction(id: string): Promise<void> {
    await firestore.collection(this.collection).doc(id).delete();
  }

  async listTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    let query = firestore.collection(this.collection);

    if (filters?.type) {
      query = query.where('type', '==', filters.type);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.categoryId) {
      query = query.where('category.id', '==', filters.categoryId);
    }

    if (filters?.startDate) {
      query = query.where('date', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('date', '<=', filters.endDate);
    }

    if (filters?.currency) {
      query = query.where('currency', '==', filters.currency);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.where('tags', 'array-contains-any', filters.tags);
    }

    const snapshot = await query.get();
    let transactions = snapshot.docs.map(doc => doc.data() as Transaction);

    // Apply additional filters that can't be done in Firestore
    if (filters?.minAmount) {
      transactions = transactions.filter(t => t.amount >= filters.minAmount!);
    }

    if (filters?.maxAmount) {
      transactions = transactions.filter(t => t.amount <= filters.maxAmount!);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      transactions = transactions.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower) ||
        t.category.name.toLowerCase().includes(searchLower)
      );
    }

    return transactions;
  }

  async updateTransactionStatus(id: string, status: Transaction['status']): Promise<Transaction> {
    return this.updateTransaction(id, { status });
  }

  async addAttachment(id: string, attachment: Transaction['attachments'][0]): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const attachments = [...(transaction.attachments || []), attachment];
    return this.updateTransaction(id, { attachments });
  }

  async removeAttachment(id: string, attachmentId: string): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const attachments = transaction.attachments?.filter(a => a.id !== attachmentId) || [];
    return this.updateTransaction(id, { attachments });
  }
} 