import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
  FinancialStatement, 
  BalanceSheet, 
  IncomeStatement, 
  CashFlowStatement,
  JournalEntry,
  Account,
  AccountType
} from '../types/accounting';

export class FinancialStatementService {
  private db = getFirestore();

  async generateBalanceSheet(startDate: Date, endDate: Date): Promise<BalanceSheet> {
    const accounts = await this.getAccounts();
    const entries = await this.getJournalEntries(startDate, endDate);

    const balanceSheet: BalanceSheet = {
      assets: {
        current: {
          cash: this.calculateAccountBalance(accounts, entries, 'asset', 'cash'),
          accountsReceivable: this.calculateAccountBalance(accounts, entries, 'asset', 'accounts-receivable'),
          inventory: this.calculateAccountBalance(accounts, entries, 'asset', 'inventory'),
          prepaidExpenses: this.calculateAccountBalance(accounts, entries, 'asset', 'prepaid-expenses'),
          otherCurrentAssets: this.calculateAccountBalance(accounts, entries, 'asset', 'other-current-assets'),
        },
        fixed: {
          property: this.calculateAccountBalance(accounts, entries, 'asset', 'property'),
          equipment: this.calculateAccountBalance(accounts, entries, 'asset', 'equipment'),
          vehicles: this.calculateAccountBalance(accounts, entries, 'asset', 'vehicles'),
          otherFixedAssets: this.calculateAccountBalance(accounts, entries, 'asset', 'other-fixed-assets'),
        },
        other: {
          investments: this.calculateAccountBalance(accounts, entries, 'asset', 'investments'),
          intangibleAssets: this.calculateAccountBalance(accounts, entries, 'asset', 'intangible-assets'),
          otherAssets: this.calculateAccountBalance(accounts, entries, 'asset', 'other-assets'),
        },
      },
      liabilities: {
        current: {
          accountsPayable: this.calculateAccountBalance(accounts, entries, 'liability', 'accounts-payable'),
          shortTermLoans: this.calculateAccountBalance(accounts, entries, 'liability', 'short-term-loans'),
          accruedExpenses: this.calculateAccountBalance(accounts, entries, 'liability', 'accrued-expenses'),
          otherCurrentLiabilities: this.calculateAccountBalance(accounts, entries, 'liability', 'other-current-liabilities'),
        },
        longTerm: {
          longTermLoans: this.calculateAccountBalance(accounts, entries, 'liability', 'long-term-loans'),
          bonds: this.calculateAccountBalance(accounts, entries, 'liability', 'bonds'),
          otherLongTermLiabilities: this.calculateAccountBalance(accounts, entries, 'liability', 'other-long-term-liabilities'),
        },
      },
      equity: {
        commonStock: this.calculateAccountBalance(accounts, entries, 'equity', 'common-stock'),
        retainedEarnings: this.calculateAccountBalance(accounts, entries, 'equity', 'retained-earnings'),
        otherEquity: this.calculateAccountBalance(accounts, entries, 'equity', 'other-equity'),
      },
    };

    return balanceSheet;
  }

  async generateIncomeStatement(startDate: Date, endDate: Date): Promise<IncomeStatement> {
    const accounts = await this.getAccounts();
    const entries = await this.getJournalEntries(startDate, endDate);

    const incomeStatement: IncomeStatement = {
      revenue: {
        sales: this.calculateAccountBalance(accounts, entries, 'revenue', 'sales'),
        service: this.calculateAccountBalance(accounts, entries, 'revenue', 'service'),
        other: this.calculateAccountBalance(accounts, entries, 'revenue', 'other-revenue'),
      },
      costOfGoodsSold: this.calculateAccountBalance(accounts, entries, 'expense', 'cost-of-goods-sold'),
      grossProfit: 0, // Will be calculated
      operatingExpenses: {
        salaries: this.calculateAccountBalance(accounts, entries, 'expense', 'salaries'),
        rent: this.calculateAccountBalance(accounts, entries, 'expense', 'rent'),
        utilities: this.calculateAccountBalance(accounts, entries, 'expense', 'utilities'),
        marketing: this.calculateAccountBalance(accounts, entries, 'expense', 'marketing'),
        depreciation: this.calculateAccountBalance(accounts, entries, 'expense', 'depreciation'),
        other: this.calculateAccountBalance(accounts, entries, 'expense', 'other-expenses'),
      },
      operatingIncome: 0, // Will be calculated
      otherIncome: this.calculateAccountBalance(accounts, entries, 'revenue', 'other-income'),
      otherExpenses: this.calculateAccountBalance(accounts, entries, 'expense', 'other-expenses'),
      netIncome: 0, // Will be calculated
    };

    // Calculate derived values
    const totalRevenue = incomeStatement.revenue.sales + incomeStatement.revenue.service + incomeStatement.revenue.other;
    incomeStatement.grossProfit = totalRevenue - incomeStatement.costOfGoodsSold;

    const totalOperatingExpenses = Object.values(incomeStatement.operatingExpenses).reduce((sum, value) => sum + value, 0);
    incomeStatement.operatingIncome = incomeStatement.grossProfit - totalOperatingExpenses;

    incomeStatement.netIncome = incomeStatement.operatingIncome + incomeStatement.otherIncome - incomeStatement.otherExpenses;

    return incomeStatement;
  }

  async generateCashFlowStatement(startDate: Date, endDate: Date): Promise<CashFlowStatement> {
    const accounts = await this.getAccounts();
    const entries = await this.getJournalEntries(startDate, endDate);

    const cashFlowStatement: CashFlowStatement = {
      operating: {
        netIncome: await this.getNetIncome(startDate, endDate),
        adjustments: {
          depreciation: this.calculateAccountBalance(accounts, entries, 'expense', 'depreciation'),
          accountsReceivable: this.calculateAccountBalance(accounts, entries, 'asset', 'accounts-receivable'),
          inventory: this.calculateAccountBalance(accounts, entries, 'asset', 'inventory'),
          accountsPayable: this.calculateAccountBalance(accounts, entries, 'liability', 'accounts-payable'),
          other: this.calculateAccountBalance(accounts, entries, 'asset', 'other-current-assets'),
        },
        netCashFromOperations: 0, // Will be calculated
      },
      investing: {
        purchaseOfAssets: this.calculateAccountBalance(accounts, entries, 'asset', 'fixed-assets'),
        saleOfAssets: this.calculateAccountBalance(accounts, entries, 'revenue', 'asset-sales'),
        investments: this.calculateAccountBalance(accounts, entries, 'asset', 'investments'),
        other: this.calculateAccountBalance(accounts, entries, 'asset', 'other-assets'),
        netCashFromInvesting: 0, // Will be calculated
      },
      financing: {
        loans: this.calculateAccountBalance(accounts, entries, 'liability', 'loans'),
        repayments: this.calculateAccountBalance(accounts, entries, 'liability', 'loan-repayments'),
        dividends: this.calculateAccountBalance(accounts, entries, 'equity', 'dividends'),
        other: this.calculateAccountBalance(accounts, entries, 'equity', 'other-equity'),
        netCashFromFinancing: 0, // Will be calculated
      },
      netChangeInCash: 0, // Will be calculated
      beginningCash: await this.getBeginningCash(startDate),
      endingCash: await this.getEndingCash(endDate),
    };

    // Calculate derived values
    const totalAdjustments = Object.values(cashFlowStatement.operating.adjustments).reduce((sum, value) => sum + value, 0);
    cashFlowStatement.operating.netCashFromOperations = cashFlowStatement.operating.netIncome + totalAdjustments;

    const totalInvesting = cashFlowStatement.investing.purchaseOfAssets + 
      cashFlowStatement.investing.saleOfAssets + 
      cashFlowStatement.investing.investments + 
      cashFlowStatement.investing.other;
    cashFlowStatement.investing.netCashFromInvesting = totalInvesting;

    const totalFinancing = cashFlowStatement.financing.loans + 
      cashFlowStatement.financing.repayments + 
      cashFlowStatement.financing.dividends + 
      cashFlowStatement.financing.other;
    cashFlowStatement.financing.netCashFromFinancing = totalFinancing;

    cashFlowStatement.netChangeInCash = 
      cashFlowStatement.operating.netCashFromOperations +
      cashFlowStatement.investing.netCashFromInvesting +
      cashFlowStatement.financing.netCashFromFinancing;

    return cashFlowStatement;
  }

  private async getAccounts(): Promise<Account[]> {
    const accountsRef = collection(this.db, 'accounts');
    const snapshot = await getDocs(accountsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  }

  private async getJournalEntries(startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    const entriesRef = collection(this.db, 'journalEntries');
    const q = query(
      entriesRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      where('status', '==', 'posted'),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
  }

  private calculateAccountBalance(
    accounts: Account[],
    entries: JournalEntry[],
    type: AccountType,
    category: string
  ): number {
    const relevantAccounts = accounts.filter(account => 
      account.type === type && account.code.toLowerCase().includes(category.toLowerCase())
    );

    return entries.reduce((balance, entry) => {
      const relevantLines = entry.entries.filter(line => 
        relevantAccounts.some(account => account.id === line.accountId)
      );

      return balance + relevantLines.reduce((lineBalance, line) => {
        if (type === 'asset' || type === 'expense') {
          return lineBalance + (line.debit - line.credit);
        } else {
          return lineBalance + (line.credit - line.debit);
        }
      }, 0);
    }, 0);
  }

  private async getNetIncome(startDate: Date, endDate: Date): Promise<number> {
    const incomeStatement = await this.generateIncomeStatement(startDate, endDate);
    return incomeStatement.netIncome;
  }

  private async getBeginningCash(date: Date): Promise<number> {
    const accounts = await this.getAccounts();
    const entries = await this.getJournalEntries(new Date(0), date);
    return this.calculateAccountBalance(accounts, entries, 'asset', 'cash');
  }

  private async getEndingCash(date: Date): Promise<number> {
    const accounts = await this.getAccounts();
    const entries = await this.getJournalEntries(new Date(0), date);
    return this.calculateAccountBalance(accounts, entries, 'asset', 'cash');
  }
}

export const financialStatementService = new FinancialStatementService(); 