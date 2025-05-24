import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Transaction } from '../models/Transaction';
import { Currency } from '../models/Currency';
import { CURRENCIES } from '../models/Currency';
import { Budget } from '../models/Budget';
import { Invoice } from '../models/Invoice';
import { FinancialReport } from './ReportService';
import { ExcelService } from './ExcelService';
import { formatCurrency } from '../utils/invoiceUtils';
import { ExcelExportUtil, ExcelExportOptions } from '../utils/excelExport';
import { FuelSale, Expense, Shift } from '../types/petrolStation';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { JournalEntry } from '../models/JournalEntry';
import { TaxTransaction } from '../models/Tax';
import { BankReconciliation } from '../models/BankReconciliation';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportType = 'transactions' | 'budgets' | 'invoices' | 'report' | 'journal_entries' | 'tax_transactions' | 'bank_reconciliations' | 'financial_report';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  startDate?: Date;
  endDate?: Date;
  includeCharts?: boolean;
  includeAttachments?: boolean;
  filters?: {
    [key: string]: any;
  };
  filename?: string;
  includeMetadata?: boolean;
  dateFormat?: string;
}

export interface ReportData {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    categoryBreakdown: {
      [category: string]: {
        amount: number;
        percentage: number;
      };
    };
    monthlyTrends: {
      [month: string]: {
        income: number;
        expenses: number;
      };
    };
  };
}

export class ExportService {
  private static instance: ExportService;
  private readonly excelService: ExcelService;
  private excelUtil = ExcelExportUtil.getInstance();

  private constructor() {
    this.excelService = ExcelService.getInstance();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportData(data: any, options: ExportOptions): Promise<void> {
    const filename = options.filename || `${options.type}_${new Date().toISOString().split('T')[0]}`;

    switch (options.format) {
      case 'xlsx':
        await this.exportToExcel(data, filename);
        break;
      case 'csv':
        await this.exportToCSV(data, options);
        break;
      case 'pdf':
        await this.exportToPDF(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToExcel(data: any, filename: string): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${filename}.xlsx`);
  }

  private async exportToCSV(data: any, options: ExportOptions): Promise<void> {
    const rows: string[][] = [];
    let headers: string[] = [];

    switch (options.type) {
      case 'transactions':
        headers = ['Date', 'Description', 'Amount', 'Currency', 'Category', 'Status'];
        rows.push(headers);
        (data as Transaction[]).forEach(transaction => {
          rows.push([
            transaction.date.toLocaleDateString(),
            transaction.description,
            transaction.amount.toString(),
            transaction.currency,
            transaction.category.name,
            transaction.status,
          ]);
        });
        break;

      case 'budgets':
        headers = ['Name', 'Period', 'Total Amount', 'Spent', 'Remaining', 'Status'];
        rows.push(headers);
        (data as Budget[]).forEach(budget => {
          rows.push([
            budget.name,
            budget.period,
            budget.totalAmount.toString(),
            budget.totalSpent.toString(),
            budget.totalRemaining.toString(),
            budget.status,
          ]);
        });
        break;

      case 'invoices':
        headers = ['Number', 'Client', 'Amount', 'Currency', 'Status', 'Due Date'];
        rows.push(headers);
        (data as Invoice[]).forEach(invoice => {
          rows.push([
            invoice.number,
            invoice.client.name,
            invoice.total.toString(),
            invoice.currency,
            invoice.status,
            invoice.dueDate.toLocaleDateString(),
          ]);
        });
        break;

      default:
        throw new Error(`Unsupported export type: ${options.type}`);
    }

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    saveAs(blob, `${options.filename || options.type}.csv`);
  }

  private async exportToPDF(data: any, options: ExportOptions): Promise<void> {
    // Implementation would use a PDF generation library
    throw new Error('PDF export not implemented');
  }

  private async exportTransactionsToExcel(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transactions');

    // Add headers
    sheet.addRow([
      'Date',
      'Description',
      'Amount',
      'Currency',
      'Category',
      'Status',
      'Payment Method',
      'Notes',
    ]);

    // Add data
    transactions.forEach(transaction => {
      sheet.addRow([
        transaction.date.toLocaleDateString(),
        transaction.description,
        transaction.amount,
        transaction.currency,
        transaction.category.name,
        transaction.status,
        transaction.paymentMethod || '',
        transaction.notes || '',
      ]);
    });

    // Style the sheet
    this.styleTransactionSheet(sheet);

    await this.exportToExcel(workbook.xlsx.writeBuffer(), options.filename || 'transactions');
  }

  private async exportBudgetsToExcel(
    budgets: Budget[],
    options: ExportOptions
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Budgets');

    // Add headers
    sheet.addRow([
      'Name',
      'Period',
      'Total Amount',
      'Spent',
      'Remaining',
      'Status',
      'Start Date',
      'End Date',
    ]);

    // Add data
    budgets.forEach(budget => {
      sheet.addRow([
        budget.name,
        budget.period,
        budget.totalAmount,
        budget.totalSpent,
        budget.totalRemaining,
        budget.status,
        budget.startDate.toLocaleDateString(),
        budget.endDate.toLocaleDateString(),
      ]);
    });

    // Style the sheet
    this.styleBudgetSheet(sheet);

    await this.exportToExcel(workbook.xlsx.writeBuffer(), options.filename || 'budgets');
  }

  private async exportInvoicesToExcel(
    invoices: Invoice[],
    options: ExportOptions
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Invoices');

    // Add headers
    sheet.addRow([
      'Number',
      'Client',
      'Amount',
      'Currency',
      'Status',
      'Issue Date',
      'Due Date',
      'Payment Method',
    ]);

    // Add data
    invoices.forEach(invoice => {
      sheet.addRow([
        invoice.number,
        invoice.client.name,
        invoice.total,
        invoice.currency,
        invoice.status,
        invoice.issueDate.toLocaleDateString(),
        invoice.dueDate.toLocaleDateString(),
        invoice.paymentMethod || '',
      ]);
    });

    // Style the sheet
    this.styleInvoiceSheet(sheet);

    await this.exportToExcel(workbook.xlsx.writeBuffer(), options.filename || 'invoices');
  }

  private styleTransactionSheet(sheet: ExcelJS.Worksheet): void {
    // Style headers
    sheet.getRow(1).font = { bold: true };

    // Add borders
    sheet.getRows(1, sheet.rowCount)?.forEach(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }

  private styleBudgetSheet(sheet: ExcelJS.Worksheet): void {
    // Style headers
    sheet.getRow(1).font = { bold: true };

    // Add borders
    sheet.getRows(1, sheet.rowCount)?.forEach(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }

  private styleInvoiceSheet(sheet: ExcelJS.Worksheet): void {
    // Style headers
    sheet.getRow(1).font = { bold: true };

    // Add borders
    sheet.getRows(1, sheet.rowCount)?.forEach(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }

  public generateReport(transactions: Transaction[], options: ExportOptions): ReportData {
    const filteredTransactions = this.filterTransactions(transactions, options);
    const summary = this.calculateSummary(filteredTransactions, options.currency);

    return {
      transactions: filteredTransactions,
      summary
    };
  }

  private filterTransactions(transactions: Transaction[], options: ExportOptions): Transaction[] {
    return transactions.filter(t => {
      // Filter by date range
      if (options.dateRange) {
        const date = new Date(t.date);
        if (date < options.dateRange.start || date > options.dateRange.end) {
          return false;
        }
      }

      // Filter by categories
      if (options.categories && options.categories.length > 0) {
        if (!options.categories.includes(t.category)) {
          return false;
        }
      }

      // Filter by currency
      if (options.currency && t.currency !== options.currency) {
        return false;
      }

      return true;
    });
  }

  private calculateSummary(transactions: Transaction[], currency?: Currency): ReportData['summary'] {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + this.convertCurrency(t.amount, t.currency, currency), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + this.convertCurrency(t.amount, t.currency, currency), 0);

    const netBalance = totalIncome - totalExpenses;

    // Calculate category breakdown
    const categoryBreakdown: ReportData['summary']['categoryBreakdown'] = {};
    const categoryTotals = new Map<string, number>();

    transactions.forEach(t => {
      const amount = this.convertCurrency(t.amount, t.currency, currency);
      const current = categoryTotals.get(t.category) || 0;
      categoryTotals.set(t.category, current + amount);
    });

    categoryTotals.forEach((amount, category) => {
      categoryBreakdown[category] = {
        amount,
        percentage: (amount / totalExpenses) * 100
      };
    });

    // Calculate monthly trends
    const monthlyTrends: ReportData['summary']['monthlyTrends'] = {};
    transactions.forEach(t => {
      const month = t.date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const amount = this.convertCurrency(t.amount, t.currency, currency);

      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        monthlyTrends[month].income += amount;
      } else {
        monthlyTrends[month].expenses += amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      monthlyTrends
    };
  }

  private formatCurrency(amount: number, currency?: Currency): string {
    const currencyInfo = currency ? CURRENCIES[currency] : CURRENCIES['KES'];
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyInfo.code,
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces
    }).format(amount);
  }

  private convertCurrency(amount: number, fromCurrency: Currency, toCurrency?: Currency): number {
    if (!toCurrency || fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = CURRENCIES[fromCurrency].exchangeRate || 1;
    const toRate = CURRENCIES[toCurrency].exchangeRate || 1;
    return (amount * fromRate) / toRate;
  }

  public exportShiftReport(
    shift: Shift,
    fuelSales: FuelSale[],
    expenses: Expense[]
  ): void {
    try {
      const options: ExcelExportOptions = {
        filename: `Shift_Report_${format(shift.startTime, 'yyyy-MM-dd_HH-mm')}`,
        headerStyle: {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center' }
        },
        dataStyle: {
          alignment: { horizontal: 'left' }
        }
      };

      // Prepare shift summary
      const shiftSummary = {
        'Shift ID': shift.id,
        'Start Time': format(shift.startTime, 'yyyy-MM-dd HH:mm:ss'),
        'End Time': shift.endTime ? format(shift.endTime, 'yyyy-MM-dd HH:mm:ss') : 'Ongoing',
        'Attendant': shift.attendantId,
        'Total Fuel Sales': this.calculateTotalFuelSales(fuelSales),
        'Total Expenses': this.calculateTotalExpenses(expenses),
        'Net Amount': this.calculateTotalFuelSales(fuelSales) - this.calculateTotalExpenses(expenses)
      };

      // Prepare fuel sales data
      const fuelSalesData = fuelSales.map(sale => ({
        'Time': format(sale.timestamp, 'HH:mm:ss'),
        'Fuel Type': sale.fuelType,
        'Volume (L)': sale.volume,
        'Price per Liter': sale.pricePerLiter,
        'Total Amount': sale.totalAmount,
        'Payment Method': sale.paymentMethod
      }));

      // Prepare expenses data
      const expensesData = expenses.map(expense => ({
        'Time': format(expense.timestamp, 'HH:mm:ss'),
        'Category': expense.category,
        'Description': expense.description,
        'Amount': expense.amount,
        'Payment Method': expense.paymentMethod
      }));

      // Export with multiple sheets
      this.excelUtil.exportMultipleSheets(
        [
          { data: [shiftSummary], name: 'Shift Summary' },
          { data: fuelSalesData, name: 'Fuel Sales' },
          { data: expensesData, name: 'Expenses' }
        ],
        options
      );
    } catch (error) {
      console.error('Error exporting shift report:', error);
      throw error;
    }
  }

  public exportFuelSalesReport(fuelSales: FuelSale[], dateRange: { start: Date; end: Date }): void {
    try {
      const options: ExcelExportOptions = {
        filename: `Fuel_Sales_Report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}`,
        headerStyle: {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center' }
        }
      };

      const reportData = fuelSales.map(sale => ({
        'Date': format(sale.timestamp, 'yyyy-MM-dd'),
        'Time': format(sale.timestamp, 'HH:mm:ss'),
        'Fuel Type': sale.fuelType,
        'Volume (L)': sale.volume,
        'Price per Liter': sale.pricePerLiter,
        'Total Amount': sale.totalAmount,
        'Payment Method': sale.paymentMethod,
        'Attendant': sale.attendantId
      }));

      this.excelUtil.exportToExcel(reportData, options);
    } catch (error) {
      console.error('Error exporting fuel sales report:', error);
      throw error;
    }
  }

  public exportExpensesReport(expenses: Expense[], dateRange: { start: Date; end: Date }): void {
    try {
      const options: ExcelExportOptions = {
        filename: `Expenses_Report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}`,
        headerStyle: {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center' }
        }
      };

      const reportData = expenses.map(expense => ({
        'Date': format(expense.timestamp, 'yyyy-MM-dd'),
        'Time': format(expense.timestamp, 'HH:mm:ss'),
        'Category': expense.category,
        'Description': expense.description,
        'Amount': expense.amount,
        'Payment Method': expense.paymentMethod,
        'Attendant': expense.attendantId
      }));

      this.excelUtil.exportToExcel(reportData, options);
    } catch (error) {
      console.error('Error exporting expenses report:', error);
      throw error;
    }
  }

  private calculateTotalFuelSales(fuelSales: FuelSale[]): number {
    return fuelSales.reduce((total, sale) => total + sale.totalAmount, 0);
  }

  private calculateTotalExpenses(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  async exportJournalEntries(
    entries: JournalEntry[],
    options: ExportOptions
  ): Promise<void> {
    const data = entries.map(entry => ({
      Date: this.formatDate(entry.date, options.dateFormat),
      Type: entry.type,
      Amount: entry.amount,
      Description: entry.description,
      Category: entry.category,
      Reference: entry.reference,
      Status: entry.status,
      Currency: entry.currency
    }));

    await this.exportData(data, 'journal_entries', options);
  }

  async exportTaxTransactions(
    transactions: TaxTransaction[],
    options: ExportOptions
  ): Promise<void> {
    const data = transactions.map(transaction => ({
      Date: this.formatDate(transaction.date, options.dateFormat),
      Type: transaction.type,
      Amount: transaction.amount,
      TaxAmount: transaction.taxAmount,
      Status: transaction.status,
      DueDate: this.formatDate(transaction.dueDate, options.dateFormat),
      Reference: transaction.reference,
      Description: transaction.description,
      Currency: transaction.currency
    }));

    await this.exportData(data, 'tax_transactions', options);
  }

  async exportBankReconciliations(
    reconciliations: BankReconciliation[],
    options: ExportOptions
  ): Promise<void> {
    const data = reconciliations.map(reconciliation => ({
      StatementDate: this.formatDate(reconciliation.statementDate, options.dateFormat),
      Account: reconciliation.account?.name,
      OpeningBalance: reconciliation.openingBalance,
      ClosingBalance: reconciliation.closingBalance,
      Status: reconciliation.status,
      Currency: reconciliation.currency,
      TotalCredits: reconciliation.reconciliationSummary.totalCredits,
      TotalDebits: reconciliation.reconciliationSummary.totalDebits,
      OutstandingDeposits: reconciliation.reconciliationSummary.outstandingDeposits,
      OutstandingChecks: reconciliation.reconciliationSummary.outstandingChecks
    }));

    await this.exportData(data, 'bank_reconciliations', options);
  }

  async exportFinancialReport(
    report: FinancialReport,
    options: ExportOptions
  ): Promise<void> {
    const data = [
      {
        Period: `${this.formatDate(report.period.startDate)} - ${this.formatDate(report.period.endDate)}`,
        TotalIncome: report.totalIncome,
        TotalExpenses: report.totalExpenses,
        NetIncome: report.netIncome,
        TotalTax: report.taxSummary.totalTax,
        Currency: report.currency
      },
      // Tax Breakdown
      ...Object.entries(report.taxSummary.taxBreakdown).map(([type, amount]) => ({
        Category: 'Tax Breakdown',
        Type: type,
        Amount: amount
      })),
      // Bank Summary
      {
        Category: 'Bank Summary',
        TotalDeposits: report.bankSummary.totalDeposits,
        TotalWithdrawals: report.bankSummary.totalWithdrawals,
        OutstandingReconciliations: report.bankSummary.outstandingReconciliations
      }
    ];

    await this.exportData(data, 'financial_report', options);
  }

  private formatDate(date: Date, format?: string): string {
    if (!format) {
      return date.toLocaleDateString();
    }

    // Implement custom date formatting if needed
    return date.toLocaleDateString();
  }
} 