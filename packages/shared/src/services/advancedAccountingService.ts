import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { JournalEntry, Account, TaxRate, ReconciliationEntry } from '../types/accounting';

export class AdvancedAccountingService {
  // Double-entry validation
  async validateJournalEntry(entry: JournalEntry): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    // Check if entry has at least two lines
    if (entry.entries.length < 2) {
      errors.push('Journal entry must have at least two lines');
      return { isValid: false, errors };
    }

    // Calculate totals and validate account types
    for (const line of entry.entries) {
      const account = await this.getAccount(line.accountId);
      if (!account) {
        errors.push(`Account ${line.accountId} not found`);
        continue;
      }

      totalDebits += line.debit;
      totalCredits += line.credit;

      // Validate account type restrictions
      if (account.type === 'asset' && line.credit > 0 && !this.isAssetReductionAllowed(account)) {
        errors.push(`Credit entries not allowed for asset account ${account.name}`);
      }
      if (account.type === 'liability' && line.debit > 0 && !this.isLiabilityReductionAllowed(account)) {
        errors.push(`Debit entries not allowed for liability account ${account.name}`);
      }
    }

    // Check if debits equal credits
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(`Debits (${totalDebits}) must equal credits (${totalCredits})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isAssetReductionAllowed(account: Account): boolean {
    // Add logic for specific asset accounts that can be reduced
    return ['cash', 'accounts_receivable'].includes(account.code);
  }

  private isLiabilityReductionAllowed(account: Account): boolean {
    // Add logic for specific liability accounts that can be reduced
    return ['accounts_payable'].includes(account.code);
  }

  // Tax calculations
  async calculateTaxes(entries: JournalEntry[], taxRates: TaxRate[]): Promise<{
    taxableIncome: number;
    taxLiability: number;
    breakdown: { [key: string]: number };
  }> {
    let taxableIncome = 0;
    const breakdown: { [key: string]: number } = {};

    // Calculate taxable income from revenue and expense accounts
    for (const entry of entries) {
      for (const line of entry.entries) {
        const account = await this.getAccount(line.accountId);
        if (!account) continue;

        if (account.type === 'revenue') {
          taxableIncome += line.credit;
          breakdown[account.name] = (breakdown[account.name] || 0) + line.credit;
        } else if (account.type === 'expense') {
          taxableIncome -= line.debit;
          breakdown[account.name] = (breakdown[account.name] || 0) - line.debit;
        }
      }
    }

    // Calculate tax liability based on tax rates
    let taxLiability = 0;
    let remainingIncome = taxableIncome;

    for (const rate of taxRates) {
      const taxableAmount = Math.min(remainingIncome, rate.threshold);
      taxLiability += taxableAmount * rate.rate;
      remainingIncome -= taxableAmount;

      if (remainingIncome <= 0) break;
    }

    return {
      taxableIncome,
      taxLiability,
      breakdown,
    };
  }

  // Bank reconciliation
  async reconcileAccount(
    accountId: string,
    startDate: Date,
    endDate: Date,
    bankStatement: { date: Date; amount: number; reference: string }[]
  ): Promise<{
    isReconciled: boolean;
    differences: { date: Date; amount: number; reference: string; type: 'missing' | 'extra' }[];
    summary: { bookBalance: number; bankBalance: number; difference: number };
  }> {
    const entries = await this.getJournalEntries(accountId, startDate, endDate);
    const bookTransactions = entries.map(entry => ({
      date: new Date(entry.date),
      amount: entry.entries.find(line => line.accountId === accountId)?.debit || 
              -entry.entries.find(line => line.accountId === accountId)?.credit || 0,
      reference: entry.reference,
    }));

    const differences: { date: Date; amount: number; reference: string; type: 'missing' | 'extra' }[] = [];
    const matchedTransactions = new Set<string>();

    // Find missing and extra transactions
    for (const bookTx of bookTransactions) {
      const match = bankStatement.find(
        bankTx =>
          Math.abs(bankTx.amount - bookTx.amount) < 0.01 &&
          bankTx.date.toDateString() === bookTx.date.toDateString() &&
          !matchedTransactions.has(bankTx.reference)
      );

      if (!match) {
        differences.push({
          date: bookTx.date,
          amount: bookTx.amount,
          reference: bookTx.reference,
          type: 'missing',
        });
      } else {
        matchedTransactions.add(match.reference);
      }
    }

    // Find extra bank transactions
    for (const bankTx of bankStatement) {
      if (!matchedTransactions.has(bankTx.reference)) {
        differences.push({
          date: bankTx.date,
          amount: bankTx.amount,
          reference: bankTx.reference,
          type: 'extra',
        });
      }
    }

    // Calculate balances
    const bookBalance = bookTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const bankBalance = bankStatement.reduce((sum, tx) => sum + tx.amount, 0);
    const difference = bookBalance - bankBalance;

    return {
      isReconciled: differences.length === 0 && Math.abs(difference) < 0.01,
      differences,
      summary: {
        bookBalance,
        bankBalance,
        difference,
      },
    };
  }

  // Financial analysis
  async calculateFinancialRatios(
    startDate: Date,
    endDate: Date
  ): Promise<{
    liquidity: {
      currentRatio: number;
      quickRatio: number;
      cashRatio: number;
    };
    profitability: {
      grossProfitMargin: number;
      operatingProfitMargin: number;
      netProfitMargin: number;
      returnOnAssets: number;
      returnOnEquity: number;
    };
    efficiency: {
      assetTurnover: number;
      inventoryTurnover: number;
      receivablesTurnover: number;
    };
    leverage: {
      debtToEquity: number;
      debtToAssets: number;
      interestCoverage: number;
    };
  }> {
    const entries = await this.getJournalEntries(null, startDate, endDate);
    const accounts = await this.getAllAccounts();

    // Calculate account balances
    const balances: { [key: string]: number } = {};
    for (const account of accounts) {
      balances[account.id] = this.calculateAccountBalance(account.id, entries);
    }

    // Liquidity ratios
    const currentAssets = this.sumAccountBalances(accounts.filter(a => a.type === 'asset' && a.isCurrent), balances);
    const currentLiabilities = this.sumAccountBalances(accounts.filter(a => a.type === 'liability' && a.isCurrent), balances);
    const inventory = this.sumAccountBalances(accounts.filter(a => a.code === 'inventory'), balances);
    const cash = this.sumAccountBalances(accounts.filter(a => a.code === 'cash'), balances);

    // Profitability ratios
    const revenue = this.sumAccountBalances(accounts.filter(a => a.type === 'revenue'), balances);
    const expenses = this.sumAccountBalances(accounts.filter(a => a.type === 'expense'), balances);
    const totalAssets = this.sumAccountBalances(accounts.filter(a => a.type === 'asset'), balances);
    const totalEquity = this.sumAccountBalances(accounts.filter(a => a.type === 'equity'), balances);

    // Efficiency ratios
    const averageAssets = (totalAssets + this.calculateBeginningBalance('asset', startDate)) / 2;
    const averageInventory = (inventory + this.calculateBeginningBalance('inventory', startDate)) / 2;
    const averageReceivables = this.calculateAverageReceivables(startDate, endDate);

    // Leverage ratios
    const totalLiabilities = this.sumAccountBalances(accounts.filter(a => a.type === 'liability'), balances);
    const interestExpense = this.sumAccountBalances(accounts.filter(a => a.code === 'interest_expense'), balances);

    return {
      liquidity: {
        currentRatio: currentAssets / currentLiabilities,
        quickRatio: (currentAssets - inventory) / currentLiabilities,
        cashRatio: cash / currentLiabilities,
      },
      profitability: {
        grossProfitMargin: (revenue - this.calculateCostOfGoodsSold(entries)) / revenue,
        operatingProfitMargin: (revenue - expenses) / revenue,
        netProfitMargin: (revenue - expenses) / revenue,
        returnOnAssets: (revenue - expenses) / averageAssets,
        returnOnEquity: (revenue - expenses) / totalEquity,
      },
      efficiency: {
        assetTurnover: revenue / averageAssets,
        inventoryTurnover: this.calculateCostOfGoodsSold(entries) / averageInventory,
        receivablesTurnover: revenue / averageReceivables,
      },
      leverage: {
        debtToEquity: totalLiabilities / totalEquity,
        debtToAssets: totalLiabilities / totalAssets,
        interestCoverage: (revenue - expenses) / interestExpense,
      },
    };
  }

  // Helper methods
  private async getAccount(accountId: string): Promise<Account | null> {
    const docRef = doc(db, 'accounts', accountId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Account) : null;
  }

  private async getJournalEntries(
    accountId: string | null,
    startDate: Date,
    endDate: Date
  ): Promise<JournalEntry[]> {
    const entriesRef = collection(db, 'journalEntries');
    const q = query(
      entriesRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as JournalEntry);
  }

  private async getAllAccounts(): Promise<Account[]> {
    const accountsRef = collection(db, 'accounts');
    const querySnapshot = await getDocs(accountsRef);
    return querySnapshot.docs.map(doc => doc.data() as Account);
  }

  private calculateAccountBalance(accountId: string, entries: JournalEntry[]): number {
    return entries.reduce((balance, entry) => {
      const line = entry.entries.find(l => l.accountId === accountId);
      if (!line) return balance;
      return balance + (line.debit - line.credit);
    }, 0);
  }

  private sumAccountBalances(accounts: Account[], balances: { [key: string]: number }): number {
    return accounts.reduce((sum, account) => sum + (balances[account.id] || 0), 0);
  }

  private calculateBeginningBalance(accountType: string, date: Date): number {
    // Implementation would fetch and calculate beginning balance
    return 0;
  }

  private calculateAverageReceivables(startDate: Date, endDate: Date): number {
    // Implementation would calculate average accounts receivable
    return 0;
  }

  private calculateCostOfGoodsSold(entries: JournalEntry[]): number {
    // Implementation would calculate COGS
    return 0;
  }
}

export const advancedAccountingService = new AdvancedAccountingService(); 