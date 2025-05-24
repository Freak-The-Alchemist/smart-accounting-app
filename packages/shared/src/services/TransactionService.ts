import { 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Transaction, TransactionType, TransactionStatus, TransactionCategory, TransactionSummary, TransactionFilters, TransactionAttachment } from '../models/Transaction';
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../models/Currency';
import { ValidationError } from '../utils/errors';

export class TransactionService {
  private static instance: TransactionService;
  private readonly collection = 'transactions';

  private constructor() {}

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    // Validate transaction amount
    if (transaction.amount < 0) {
      throw new ValidationError('Amount must be non-negative');
    }

    const now = new Date();
    const docRef = doc(collection(firestore, this.collection));
    
    const newTransaction: Transaction = {
      ...transaction,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(docRef, newTransaction);
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const docRef = doc(firestore, this.collection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Transaction) : null;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const docRef = doc(firestore, this.collection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Transaction not found');
    }

    const updatedTransaction = {
      ...updates,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, updatedTransaction);
    return { ...docSnap.data() as Transaction, ...updatedTransaction };
  }

  async deleteTransaction(id: string): Promise<void> {
    const docRef = doc(firestore, this.collection, id);
    await deleteDoc(docRef);
  }

  async listTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.type) {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.startDate) {
      constraints.push(where('date', '>=', filters.startDate));
    }

    if (filters?.endDate) {
      constraints.push(where('date', '<=', filters.endDate));
    }

    if (filters?.currency) {
      constraints.push(where('currency', '==', filters.currency));
    }

    const q = query(collection(firestore, this.collection), ...constraints);
    const snapshot = await getDocs(q);
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
        t.reference.toLowerCase().includes(searchLower)
      );
    }

    return transactions;
  }

  async getTransactionSummary(userId: string, startDate?: Date, endDate?: Date): Promise<TransactionSummary> {
    const transactions = await this.listTransactions({
      startDate,
      endDate,
    });

    const summary: TransactionSummary = {
      total: 0,
      byType: Object.values(TransactionType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<TransactionType, number>),
      byStatus: Object.values(TransactionStatus).reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<TransactionStatus, number>),
      byCategory: Object.values(TransactionCategory).reduce((acc, category) => ({ ...acc, [category]: 0 }), {} as Record<TransactionCategory, number>),
      byCurrency: SUPPORTED_CURRENCIES.reduce((acc, currency) => ({ ...acc, [currency]: 0 }), {} as Record<CurrencyCode, number>),
      byPeriod: {
        daily: {},
        weekly: {},
        monthly: {},
        yearly: {}
      },
      amounts: {
        total: 0,
        average: 0,
        minimum: 0,
        maximum: 0,
        byType: Object.values(TransactionType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<TransactionType, number>),
        byCategory: Object.values(TransactionCategory).reduce((acc, category) => ({ ...acc, [category]: 0 }), {} as Record<TransactionCategory, number>)
      },
      performance: {
        approvalRate: 0,
        averageApprovalTime: 0,
        reversalRate: 0,
        errorRate: 0
      }
    };

    transactions.forEach(transaction => {
      // Update totals
      summary.total += transaction.amount;
      summary.byType[transaction.type] += transaction.amount;
      summary.byStatus[transaction.status] += transaction.amount;
      if (transaction.category) {
        summary.byCategory[transaction.category] += transaction.amount;
      }
      summary.byCurrency[transaction.currency] += transaction.amount;

      // Update amounts
      summary.amounts.byType[transaction.type] += transaction.amount;
      if (transaction.category) {
        summary.amounts.byCategory[transaction.category] += transaction.amount;
      }

      // Update period breakdowns
      const date = transaction.date;
      const dailyKey = date.toISOString().split('T')[0];
      const weeklyKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
      const monthlyKey = date.toISOString().slice(0, 7);
      const yearlyKey = date.getFullYear().toString();

      summary.byPeriod.daily[dailyKey] = (summary.byPeriod.daily[dailyKey] || 0) + transaction.amount;
      summary.byPeriod.weekly[weeklyKey] = (summary.byPeriod.weekly[weeklyKey] || 0) + transaction.amount;
      summary.byPeriod.monthly[monthlyKey] = (summary.byPeriod.monthly[monthlyKey] || 0) + transaction.amount;
      summary.byPeriod.yearly[yearlyKey] = (summary.byPeriod.yearly[yearlyKey] || 0) + transaction.amount;
    });

    // Calculate averages and min/max
    const amounts = transactions.map(t => t.amount);
    summary.amounts.average = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    summary.amounts.minimum = amounts.length ? Math.min(...amounts) : 0;
    summary.amounts.maximum = amounts.length ? Math.max(...amounts) : 0;

    // Calculate performance metrics
    const approvedTransactions = transactions.filter(t => t.status === TransactionStatus.COMPLETED);
    const reversedTransactions = transactions.filter(t => t.status === TransactionStatus.REVERSED);
    const failedTransactions = transactions.filter(t => t.status === TransactionStatus.FAILED);

    summary.performance.approvalRate = transactions.length ? approvedTransactions.length / transactions.length : 0;
    summary.performance.reversalRate = transactions.length ? reversedTransactions.length / transactions.length : 0;
    summary.performance.errorRate = transactions.length ? failedTransactions.length / transactions.length : 0;

    return summary;
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    return this.updateTransaction(id, { status });
  }

  async addAttachment(id: string, attachment: TransactionAttachment): Promise<Transaction> {
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const updatedAttachments = [...(transaction.attachments || []), attachment];
    return this.updateTransaction(id, { attachments: updatedAttachments });
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