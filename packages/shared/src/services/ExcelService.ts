import * as XLSX from 'xlsx';
import { Report, ReportData } from '../models/Report';
import { Transaction } from '../models/Transaction';
import { CurrencyService, Currency } from './CurrencyService';

export class ExcelService {
  private currencyService: CurrencyService;

  constructor() {
    this.currencyService = CurrencyService.getInstance();
  }

  async exportReportToExcel(report: Report, targetCurrency: Currency = 'KES'): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = await this.prepareSummarySheet(report.data, targetCurrency);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Transactions Sheet
    const transactionsData = this.prepareTransactionsSheet(report.data.transactions, targetCurrency);
    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

    // Categories Sheet
    const categoriesData = this.prepareCategoriesSheet(report.data.categories, targetCurrency);
    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');

    // Trends Sheet
    const trendsData = this.prepareTrendsSheet(report.data.trends, targetCurrency);
    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');

    // Generate Excel file
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async prepareSummarySheet(data: ReportData, targetCurrency: Currency): Promise<any[][]> {
    const summary = data.summary;
    return [
      ['Financial Summary', ''],
      ['', ''],
      ['Total Income', await this.formatCurrency(summary.totalIncome, targetCurrency)],
      ['Total Expense', await this.formatCurrency(summary.totalExpense, targetCurrency)],
      ['Net Amount', await this.formatCurrency(summary.netAmount, targetCurrency)],
      ['', ''],
      ['Report Period', `${data.transactions.income[0]?.period.start.toLocaleDateString()} - ${data.transactions.income[0]?.period.end.toLocaleDateString()}`]
    ];
  }

  private prepareTransactionsSheet(transactions: ReportData['transactions'], targetCurrency: Currency): any[][] {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = [
      ...transactions.income.map(t => [
        t.period.start.toLocaleDateString(),
        'Income',
        Object.keys(t.categoryBreakdown)[0],
        t.totalIncome,
        ''
      ]),
      ...transactions.expense.map(t => [
        t.period.start.toLocaleDateString(),
        'Expense',
        Object.keys(t.categoryBreakdown)[0],
        -t.totalExpense,
        ''
      ])
    ];
    return [headers, ...rows];
  }

  private prepareCategoriesSheet(categories: ReportData['categories'], targetCurrency: Currency): any[][] {
    const headers = ['Category', 'Amount', 'Percentage', 'Type'];
    const rows = Object.entries(categories).map(([category, data]) => [
      category,
      data.amount,
      `${data.percentage.toFixed(2)}%`,
      data.type
    ]);
    return [headers, ...rows];
  }

  private prepareTrendsSheet(trends: ReportData['trends'], targetCurrency: Currency): any[][] {
    const headers = ['Period', 'Amount'];
    const rows: any[][] = [];

    if (trends.daily) {
      rows.push(['Daily Trends']);
      trends.daily.forEach((amount, index) => {
        rows.push([`Day ${index + 1}`, amount]);
      });
    }

    if (trends.weekly) {
      rows.push(['', '']);
      rows.push(['Weekly Trends']);
      trends.weekly.forEach((amount, index) => {
        rows.push([`Week ${index + 1}`, amount]);
      });
    }

    if (trends.monthly) {
      rows.push(['', '']);
      rows.push(['Monthly Trends']);
      trends.monthly.forEach((amount, index) => {
        rows.push([`Month ${index + 1}`, amount]);
      });
    }

    return [headers, ...rows];
  }

  private async formatCurrency(amount: number, currency: Currency): Promise<string> {
    return this.currencyService.formatAmount(amount, currency);
  }
} 