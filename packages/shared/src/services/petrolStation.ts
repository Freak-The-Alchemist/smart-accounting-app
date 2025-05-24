import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  startOf,
  endOf,
} from 'firebase/firestore';
import { FuelSale, Shift, Expense } from '../types/petrolStation';
import { CacheService } from './cacheService';

export class PetrolStationService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  async getFinancialData() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get fuel sales with caching
      const sales = await this.cacheService.getFuelSales(startOfMonth, endOfMonth);

      // Get expenses with caching
      const expenses = await this.cacheService.getExpenses(startOfMonth, endOfMonth);

      // Calculate total revenue
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate net profit
      const netProfit = totalRevenue - totalExpenses;

      // Prepare revenue vs expenses data for charts
      const revenueVsExpenses = this.prepareRevenueVsExpensesData(sales, expenses);

      // Prepare expense distribution data
      const expenseDistribution = this.prepareExpenseDistributionData(expenses);

      // Prepare income statement
      const incomeStatement = this.prepareIncomeStatement(sales, expenses);

      // Prepare balance sheet
      const balanceSheet = await this.prepareBalanceSheet();

      // Prepare cash flow statement
      const cashFlow = this.prepareCashFlowStatement(sales, expenses);

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        revenueVsExpenses,
        expenseDistribution,
        incomeStatement,
        balanceSheet,
        cashFlow,
      };
    } catch (error) {
      console.error('Error getting financial data:', error);
      throw error;
    }
  }

  private prepareRevenueVsExpensesData(sales: FuelSale[], expenses: Expense[]) {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    const revenueByMonth = this.groupByMonth(sales, 'timestamp', 'totalAmount');
    const expensesByMonth = this.groupByMonth(expenses, 'date', 'amount');

    return months.map(month => ({
      month,
      revenue: revenueByMonth[month] || 0,
      expenses: expensesByMonth[month] || 0,
    }));
  }

  private prepareExpenseDistributionData(expenses: Expense[]) {
    const categories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }

  private prepareIncomeStatement(sales: FuelSale[], expenses: Expense[]) {
    const revenueCategories = sales.reduce((acc, sale) => {
      acc[sale.fuelType] = (acc[sale.fuelType] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    const expenseCategories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const statement = [
      ...Object.entries(revenueCategories).map(([category, amount]) => ({
        category: `Revenue - ${category}`,
        amount,
      })),
      { category: 'Total Revenue', amount: Object.values(revenueCategories).reduce((a, b) => a + b, 0) },
      ...Object.entries(expenseCategories).map(([category, amount]) => ({
        category: `Expense - ${category}`,
        amount: -amount,
      })),
      { category: 'Total Expenses', amount: -Object.values(expenseCategories).reduce((a, b) => a + b, 0) },
      {
        category: 'Net Income',
        amount: Object.values(revenueCategories).reduce((a, b) => a + b, 0) -
          Object.values(expenseCategories).reduce((a, b) => a + b, 0),
      },
    ];

    return statement;
  }

  private async prepareBalanceSheet() {
    // In a real application, you would fetch this data from your database
    // This is a simplified example
    return {
      assets: [
        { name: 'Cash', value: 50000 },
        { name: 'Accounts Receivable', value: 15000 },
        { name: 'Inventory', value: 25000 },
        { name: 'Equipment', value: 100000 },
      ],
      liabilities: [
        { name: 'Accounts Payable', value: 20000 },
        { name: 'Loans', value: 50000 },
        { name: 'Accrued Expenses', value: 5000 },
      ],
    };
  }

  private prepareCashFlowStatement(sales: FuelSale[], expenses: Expense[]) {
    const operatingActivities = [
      {
        category: 'Cash from Sales',
        amount: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      },
      {
        category: 'Cash Paid for Expenses',
        amount: -expenses.reduce((sum, expense) => sum + expense.amount, 0),
      },
    ];

    // In a real application, you would include investing and financing activities
    const investingActivities = [
      { category: 'Equipment Purchase', amount: -10000 },
      { category: 'Investment Income', amount: 5000 },
    ];

    const financingActivities = [
      { category: 'Loan Proceeds', amount: 50000 },
      { category: 'Loan Repayment', amount: -10000 },
    ];

    return [
      ...operatingActivities,
      ...investingActivities,
      ...financingActivities,
      {
        category: 'Net Cash Flow',
        amount:
          operatingActivities.reduce((sum, item) => sum + item.amount, 0) +
          investingActivities.reduce((sum, item) => sum + item.amount, 0) +
          financingActivities.reduce((sum, item) => sum + item.amount, 0),
      },
    ];
  }

  private groupByMonth<T extends { [key: string]: any }>(
    items: T[],
    dateField: keyof T,
    amountField: keyof T
  ) {
    return items.reduce((acc, item) => {
      const date = (item[dateField] as Timestamp).toDate();
      const month = date.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + (item[amountField] as number);
      return acc;
    }, {} as Record<string, number>);
  }
} 