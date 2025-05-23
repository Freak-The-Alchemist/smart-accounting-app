import { where, orderBy } from 'firebase/firestore';
import { BaseService } from './BaseService';
import { Report, ReportType, ReportFormat, ReportGenerationOptions, ReportData } from '../models/Report';
import { TransactionService } from './TransactionService';
import { Transaction, TransactionType, TransactionSummary } from '../models/Transaction';
import { ExcelService } from './ExcelService';
import { CurrencyService, Currency } from './CurrencyService';
import { Budget, BudgetSummary } from '../models/Budget';
import { Invoice, InvoiceSummary } from '../models/Invoice';
import { 
  collection, 
  query, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JournalEntry } from '../models/JournalEntry';
import { TaxTransaction } from '../models/Tax';
import { BankReconciliation } from '../models/BankReconciliation';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ReportOptions {
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  format: ReportFormat;
  includeCharts?: boolean;
  includeAttachments?: boolean;
  currency?: Currency;
}

export interface FinancialReport {
  transactions: TransactionSummary;
  budgets: BudgetSummary;
  invoices: InvoiceSummary;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  metadata: {
    [key: string]: any;
  };
}

export class ReportService extends BaseService<Report> {
  private transactionService: TransactionService;
  private excelService: ExcelService;
  private currencyService: CurrencyService;
  private readonly journalEntriesCollection = 'journalEntries';
  private readonly taxTransactionsCollection = 'taxTransactions';
  private readonly bankReconciliationsCollection = 'bankReconciliations';

  constructor() {
    super('reports');
    this.transactionService = new TransactionService();
    this.excelService = new ExcelService();
    this.currencyService = CurrencyService.getInstance();
  }

  async generateReport(
    userId: string,
    options: ReportGenerationOptions
  ): Promise<Report> {
    const { type, period, format } = options;
    
    // Get transaction summary for the period
    const summary = await this.transactionService.getTransactionSummary(
      userId,
      period.start,
      period.end
    );

    // Get all transactions for the period
    const transactions = await this.transactionService.getTransactionsByDateRange(
      userId,
      period.start,
      period.end
    );

    // Calculate category percentages
    const categoryBreakdown: { [key: string]: { amount: number; percentage: number; type: TransactionType } } = {};
    Object.entries(summary.categoryBreakdown).forEach(([category, data]) => {
      const amount = data.amount;
      const total = data.type === 'income' ? summary.totalIncome : summary.totalExpense;
      categoryBreakdown[category] = {
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        type: data.type
      };
    });

    // Create report data
    const reportData: ReportData = {
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netAmount: summary.netAmount
      },
      transactions: {
        income: transactions.filter(t => t.type === 'income').map(t => ({
          totalIncome: t.amount,
          totalExpense: 0,
          netAmount: t.amount,
          period: { start: t.date, end: t.date },
          categoryBreakdown: { [t.category]: { amount: t.amount, type: t.type } }
        })),
        expense: transactions.filter(t => t.type === 'expense').map(t => ({
          totalIncome: 0,
          totalExpense: t.amount,
          netAmount: -t.amount,
          period: { start: t.date, end: t.date },
          categoryBreakdown: { [t.category]: { amount: t.amount, type: t.type } }
        }))
      },
      categories: categoryBreakdown,
      trends: await this.calculateTrends(userId, type, period)
    };

    // Create report document
    const report: Omit<Report, 'id'> = {
      userId,
      type,
      period,
      data: reportData,
      format,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(report);
  }

  private async calculateTrends(
    userId: string,
    type: ReportType,
    period: { start: Date; end: Date }
  ): Promise<Report['data']['trends']> {
    const trends: Report['data']['trends'] = {};
    const transactions = await this.transactionService.getTransactionsByDateRange(
      userId,
      period.start,
      period.end
    );

    // Calculate daily trends
    if (type === 'daily' || type === 'weekly') {
      trends.daily = this.calculateDailyTrends(transactions);
    }

    // Calculate weekly trends
    if (type === 'weekly' || type === 'monthly') {
      trends.weekly = this.calculateWeeklyTrends(transactions);
    }

    // Calculate monthly trends
    if (type === 'monthly' || type === 'yearly') {
      trends.monthly = this.calculateMonthlyTrends(transactions);
    }

    return trends;
  }

  private calculateDailyTrends(transactions: Transaction[]): number[] {
    // Group transactions by date and calculate daily totals
    const dailyTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const dateKey = transaction.date.toISOString().split('T')[0];
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + amount);
    });

    // Sort dates and return array of daily net amounts
    return Array.from(dailyTotals.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([_, amount]) => amount);
  }

  private calculateWeeklyTrends(transactions: Transaction[]): number[] {
    // Group transactions by week and calculate weekly totals
    const weeklyTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      // Get the Monday of the week for the transaction date
      const date = new Date(transaction.date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) || 0) + amount);
    });

    // Sort weeks and return array of weekly net amounts
    return Array.from(weeklyTotals.entries())
      .sort(([weekA], [weekB]) => weekA.localeCompare(weekB))
      .map(([_, amount]) => amount);
  }

  private calculateMonthlyTrends(transactions: Transaction[]): number[] {
    // Group transactions by month and calculate monthly totals
    const monthlyTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().slice(0, 7); // YYYY-MM format
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
    });

    // Sort months and return array of monthly net amounts
    return Array.from(monthlyTotals.entries())
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([_, amount]) => amount);
  }

  async getReportsByType(
    userId: string,
    type: ReportType
  ): Promise<Report[]> {
    return this.getByUserId(userId, [
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    ]);
  }

  async getReportsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Report[]> {
    return this.getByUserId(userId, [
      where('period.start', '>=', startDate),
      where('period.end', '<=', endDate),
      orderBy('period.start', 'desc')
    ]);
  }

  async exportReportToExcel(
    reportId: string,
    targetCurrency: Currency = 'KES'
  ): Promise<Buffer> {
    const report = await this.getById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Convert amounts to target currency if needed
    if (targetCurrency !== 'KES') {
      await this.convertReportToCurrency(report, targetCurrency);
    }

    return this.excelService.exportReportToExcel(report, targetCurrency);
  }

  private async convertReportToCurrency(report: Report, targetCurrency: Currency): Promise<void> {
    const { data } = report;

    // Convert summary amounts
    data.summary.totalIncome = await this.currencyService.convertAmount(
      data.summary.totalIncome,
      'KES',
      targetCurrency
    );
    data.summary.totalExpense = await this.currencyService.convertAmount(
      data.summary.totalExpense,
      'KES',
      targetCurrency
    );
    data.summary.netAmount = await this.currencyService.convertAmount(
      data.summary.netAmount,
      'KES',
      targetCurrency
    );

    // Convert transaction amounts
    data.transactions.income = await Promise.all(
      data.transactions.income.map(async (t) => ({
        ...t,
        totalIncome: await this.currencyService.convertAmount(t.totalIncome, 'KES', targetCurrency),
        totalExpense: 0,
        netAmount: await this.currencyService.convertAmount(t.totalIncome, 'KES', targetCurrency),
        categoryBreakdown: Object.fromEntries(
          await Promise.all(
            Object.entries(t.categoryBreakdown).map(async ([category, data]) => [
              category,
              {
                ...data,
                amount: await this.currencyService.convertAmount(data.amount, 'KES', targetCurrency)
              }
            ])
          )
        )
      }))
    );

    data.transactions.expense = await Promise.all(
      data.transactions.expense.map(async (t) => ({
        ...t,
        totalIncome: 0,
        totalExpense: await this.currencyService.convertAmount(t.totalExpense, 'KES', targetCurrency),
        netAmount: await this.currencyService.convertAmount(-t.totalExpense, 'KES', targetCurrency),
        categoryBreakdown: Object.fromEntries(
          await Promise.all(
            Object.entries(t.categoryBreakdown).map(async ([category, data]) => [
              category,
              {
                ...data,
                amount: await this.currencyService.convertAmount(data.amount, 'KES', targetCurrency)
              }
            ])
          )
        )
      }))
    );

    // Convert category amounts
    data.categories = Object.fromEntries(
      await Promise.all(
        Object.entries(data.categories).map(async ([category, data]) => [
          category,
          {
            ...data,
            amount: await this.currencyService.convertAmount(data.amount, 'KES', targetCurrency)
          }
        ])
      )
    );

    // Convert trend amounts
    if (data.trends.daily) {
      data.trends.daily = await Promise.all(
        data.trends.daily.map(amount =>
          this.currencyService.convertAmount(amount, 'KES', targetCurrency)
        )
      );
    }
    if (data.trends.weekly) {
      data.trends.weekly = await Promise.all(
        data.trends.weekly.map(amount =>
          this.currencyService.convertAmount(amount, 'KES', targetCurrency)
        )
      );
    }
    if (data.trends.monthly) {
      data.trends.monthly = await Promise.all(
        data.trends.monthly.map(amount =>
          this.currencyService.convertAmount(amount, 'KES', targetCurrency)
        )
      );
    }
  }

  async generateFinancialReport(
    userId: string,
    options: ReportOptions
  ): Promise<FinancialReport> {
    const [transactions, budgets, invoices] = await Promise.all([
      this.getTransactionSummary(userId, options.startDate, options.endDate),
      this.getBudgetSummary(userId, options.startDate, options.endDate),
      this.getInvoiceSummary(userId, options.startDate, options.endDate),
    ]);

    const report: FinancialReport = {
      transactions,
      budgets,
      invoices,
      period: {
        start: options.startDate,
        end: options.endDate,
      },
      generatedAt: new Date(),
      metadata: {
        userId,
        format: options.format,
        includeCharts: options.includeCharts,
        includeAttachments: options.includeAttachments,
        currency: options.currency,
      },
    };

    return report;
  }

  private async getTransactionSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TransactionSummary> {
    // This would typically call TransactionService
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      byCategory: {},
      byMonth: {},
      byCurrency: {} as Record<Currency, { income: number; expenses: number; net: number }>,
    };
  }

  private async getBudgetSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetSummary> {
    // This would typically call BudgetService
    return {
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
  }

  private async getInvoiceSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InvoiceSummary> {
    // This would typically call InvoiceService
    return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalDraft: 0,
      byStatus: {
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      },
      byCurrency: {},
      byMonth: {},
    };
  }

  async exportReport(report: FinancialReport, format: ReportFormat): Promise<Blob> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(report);
      case 'excel':
        return this.exportToExcel(report);
      case 'csv':
        return this.exportToCSV(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async exportToPDF(report: FinancialReport): Promise<Blob> {
    // Implementation would use a PDF generation library
    throw new Error('PDF export not implemented');
  }

  private async exportToExcel(report: FinancialReport): Promise<Blob> {
    // Implementation would use an Excel generation library
    throw new Error('Excel export not implemented');
  }

  private async exportToCSV(report: FinancialReport): Promise<Blob> {
    // Implementation would convert report data to CSV format
    throw new Error('CSV export not implemented');
  }

  getReportPeriodDates(period: ReportPeriod, startDate: Date): { start: Date; end: Date } {
    const start = new Date(startDate);
    const end = new Date(startDate);

    switch (period) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return { start, end };
  }

  async generateFinancialReport(
    period: ReportPeriod,
    organizationId: string,
    currency: string = 'KES'
  ): Promise<FinancialReport> {
    // Get all journal entries for the period
    const journalEntries = await this.getJournalEntries(period, organizationId);
    
    // Get all tax transactions for the period
    const taxTransactions = await this.getTaxTransactions(period, organizationId);
    
    // Get all bank reconciliations for the period
    const bankReconciliations = await this.getBankReconciliations(period, organizationId);

    // Calculate totals
    const totalIncome = this.calculateTotalIncome(journalEntries);
    const totalExpenses = this.calculateTotalExpenses(journalEntries);
    const netIncome = totalIncome - totalExpenses;

    // Calculate tax summary
    const taxSummary = this.calculateTaxSummary(taxTransactions);

    // Calculate bank summary
    const bankSummary = this.calculateBankSummary(bankReconciliations);

    return {
      period,
      totalIncome,
      totalExpenses,
      netIncome,
      taxSummary,
      bankSummary,
      currency,
      organizationId,
      generatedAt: new Date()
    };
  }

  private async getJournalEntries(
    period: ReportPeriod,
    organizationId: string
  ): Promise<JournalEntry[]> {
    const q = query(
      collection(db, this.journalEntriesCollection),
      where('organizationId', '==', organizationId),
      where('date', '>=', period.startDate),
      where('date', '<=', period.endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as JournalEntry);
  }

  private async getTaxTransactions(
    period: ReportPeriod,
    organizationId: string
  ): Promise<TaxTransaction[]> {
    const q = query(
      collection(db, this.taxTransactionsCollection),
      where('organizationId', '==', organizationId),
      where('date', '>=', period.startDate),
      where('date', '<=', period.endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as TaxTransaction);
  }

  private async getBankReconciliations(
    period: ReportPeriod,
    organizationId: string
  ): Promise<BankReconciliation[]> {
    const q = query(
      collection(db, this.bankReconciliationsCollection),
      where('organizationId', '==', organizationId),
      where('statementDate', '>=', period.startDate),
      where('statementDate', '<=', period.endDate),
      orderBy('statementDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as BankReconciliation);
  }

  private calculateTotalIncome(entries: JournalEntry[]): number {
    return entries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private calculateTotalExpenses(entries: JournalEntry[]): number {
    return entries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  private calculateTaxSummary(transactions: TaxTransaction[]): FinancialReport['taxSummary'] {
    const taxBreakdown: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const type = transaction.type;
      taxBreakdown[type] = (taxBreakdown[type] || 0) + transaction.taxAmount;
    });

    const totalTax = transactions.reduce((sum, t) => sum + t.taxAmount, 0);

    return {
      totalTax,
      taxBreakdown
    };
  }

  private calculateBankSummary(
    reconciliations: BankReconciliation[]
  ): FinancialReport['bankSummary'] {
    const totalDeposits = reconciliations.reduce(
      (sum, rec) => sum + rec.reconciliationSummary.totalCredits,
      0
    );

    const totalWithdrawals = reconciliations.reduce(
      (sum, rec) => sum + rec.reconciliationSummary.totalDebits,
      0
    );

    const outstandingReconciliations = reconciliations.filter(
      rec => rec.status !== 'completed'
    ).length;

    return {
      totalDeposits,
      totalWithdrawals,
      outstandingReconciliations
    };
  }
} 