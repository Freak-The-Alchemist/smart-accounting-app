import { AccountingEntry } from '../types/accounting';

interface BalanceSheet {
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      prepaidExpenses: number;
    };
    fixed: {
      property: number;
      equipment: number;
      vehicles: number;
      otherFixedAssets: number;
    };
  };
  liabilities: {
    current: {
      accountsPayable: number;
      shortTermLoans: number;
      accruedExpenses: number;
    };
    longTerm: {
      longTermLoans: number;
      mortgages: number;
      otherLongTermLiabilities: number;
    };
  };
  equity: {
    commonStock: number;
    retainedEarnings: number;
    additionalPaidInCapital: number;
  };
}

interface IncomeStatement {
  revenue: {
    sales: number;
    services: number;
    otherRevenue: number;
  };
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    depreciation: number;
    otherOperatingExpenses: number;
  };
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
}

interface CashFlowStatement {
  operating: {
    netIncome: number;
    adjustments: {
      depreciation: number;
      accountsReceivable: number;
      inventory: number;
      accountsPayable: number;
      accruedExpenses: number;
    };
    netCashFromOperations: number;
  };
  investing: {
    propertyPurchase: number;
    equipmentPurchase: number;
    vehiclePurchase: number;
    otherInvestments: number;
  };
  financing: {
    loanProceeds: number;
    loanPayments: number;
    capitalContributions: number;
    dividends: number;
  };
  netChangeInCash: number;
  beginningCash: number;
  endingCash: number;
}

export async function generateBalanceSheet(
  entries: AccountingEntry[],
  startDate: Date,
  endDate: Date
): Promise<BalanceSheet> {
  const filteredEntries = entries.filter(
    (entry) => entry.date >= startDate && entry.date <= endDate
  );

  const balanceSheet: BalanceSheet = {
    assets: {
      current: {
        cash: 0,
        accountsReceivable: 0,
        inventory: 0,
        prepaidExpenses: 0,
      },
      fixed: {
        property: 0,
        equipment: 0,
        vehicles: 0,
        otherFixedAssets: 0,
      },
    },
    liabilities: {
      current: {
        accountsPayable: 0,
        shortTermLoans: 0,
        accruedExpenses: 0,
      },
      longTerm: {
        longTermLoans: 0,
        mortgages: 0,
        otherLongTermLiabilities: 0,
      },
    },
    equity: {
      commonStock: 0,
      retainedEarnings: 0,
      additionalPaidInCapital: 0,
    },
  };

  // Process entries to calculate balance sheet values
  filteredEntries.forEach((entry) => {
    const amount = entry.type === 'debit' ? entry.amount : -entry.amount;

    // Map categories to balance sheet accounts
    switch (entry.category) {
      // Assets
      case 'cash':
        balanceSheet.assets.current.cash += amount;
        break;
      case 'accounts_receivable':
        balanceSheet.assets.current.accountsReceivable += amount;
        break;
      case 'inventory':
        balanceSheet.assets.current.inventory += amount;
        break;
      case 'prepaid_expenses':
        balanceSheet.assets.current.prepaidExpenses += amount;
        break;
      case 'property':
        balanceSheet.assets.fixed.property += amount;
        break;
      case 'equipment':
        balanceSheet.assets.fixed.equipment += amount;
        break;
      case 'vehicles':
        balanceSheet.assets.fixed.vehicles += amount;
        break;
      case 'other_fixed_assets':
        balanceSheet.assets.fixed.otherFixedAssets += amount;
        break;

      // Liabilities
      case 'accounts_payable':
        balanceSheet.liabilities.current.accountsPayable += amount;
        break;
      case 'short_term_loans':
        balanceSheet.liabilities.current.shortTermLoans += amount;
        break;
      case 'accrued_expenses':
        balanceSheet.liabilities.current.accruedExpenses += amount;
        break;
      case 'long_term_loans':
        balanceSheet.liabilities.longTerm.longTermLoans += amount;
        break;
      case 'mortgages':
        balanceSheet.liabilities.longTerm.mortgages += amount;
        break;
      case 'other_long_term_liabilities':
        balanceSheet.liabilities.longTerm.otherLongTermLiabilities += amount;
        break;

      // Equity
      case 'common_stock':
        balanceSheet.equity.commonStock += amount;
        break;
      case 'retained_earnings':
        balanceSheet.equity.retainedEarnings += amount;
        break;
      case 'additional_paid_in_capital':
        balanceSheet.equity.additionalPaidInCapital += amount;
        break;
    }
  });

  return balanceSheet;
}

export async function generateIncomeStatement(
  entries: AccountingEntry[],
  startDate: Date,
  endDate: Date
): Promise<IncomeStatement> {
  const filteredEntries = entries.filter(
    (entry) => entry.date >= startDate && entry.date <= endDate
  );

  const incomeStatement: IncomeStatement = {
    revenue: {
      sales: 0,
      services: 0,
      otherRevenue: 0,
    },
    costOfGoodsSold: 0,
    grossProfit: 0,
    operatingExpenses: {
      salaries: 0,
      rent: 0,
      utilities: 0,
      marketing: 0,
      depreciation: 0,
      otherOperatingExpenses: 0,
    },
    operatingIncome: 0,
    otherIncome: 0,
    otherExpenses: 0,
    netIncome: 0,
  };

  // Process entries to calculate income statement values
  filteredEntries.forEach((entry) => {
    const amount = entry.type === 'credit' ? entry.amount : -entry.amount;

    // Map categories to income statement accounts
    switch (entry.category) {
      // Revenue
      case 'sales':
        incomeStatement.revenue.sales += amount;
        break;
      case 'services':
        incomeStatement.revenue.services += amount;
        break;
      case 'other_revenue':
        incomeStatement.revenue.otherRevenue += amount;
        break;

      // Cost of Goods Sold
      case 'cost_of_goods_sold':
        incomeStatement.costOfGoodsSold += amount;
        break;

      // Operating Expenses
      case 'salaries':
        incomeStatement.operatingExpenses.salaries += amount;
        break;
      case 'rent':
        incomeStatement.operatingExpenses.rent += amount;
        break;
      case 'utilities':
        incomeStatement.operatingExpenses.utilities += amount;
        break;
      case 'marketing':
        incomeStatement.operatingExpenses.marketing += amount;
        break;
      case 'depreciation':
        incomeStatement.operatingExpenses.depreciation += amount;
        break;
      case 'other_operating_expenses':
        incomeStatement.operatingExpenses.otherOperatingExpenses += amount;
        break;

      // Other Income/Expenses
      case 'other_income':
        incomeStatement.otherIncome += amount;
        break;
      case 'other_expenses':
        incomeStatement.otherExpenses += amount;
        break;
    }
  });

  // Calculate derived values
  const totalRevenue =
    incomeStatement.revenue.sales +
    incomeStatement.revenue.services +
    incomeStatement.revenue.otherRevenue;
  incomeStatement.grossProfit = totalRevenue - incomeStatement.costOfGoodsSold;

  const totalOperatingExpenses =
    incomeStatement.operatingExpenses.salaries +
    incomeStatement.operatingExpenses.rent +
    incomeStatement.operatingExpenses.utilities +
    incomeStatement.operatingExpenses.marketing +
    incomeStatement.operatingExpenses.depreciation +
    incomeStatement.operatingExpenses.otherOperatingExpenses;

  incomeStatement.operatingIncome = incomeStatement.grossProfit - totalOperatingExpenses;
  incomeStatement.netIncome =
    incomeStatement.operatingIncome + incomeStatement.otherIncome - incomeStatement.otherExpenses;

  return incomeStatement;
}

export async function generateCashFlowStatement(
  entries: AccountingEntry[],
  startDate: Date,
  endDate: Date
): Promise<CashFlowStatement> {
  const filteredEntries = entries.filter(
    (entry) => entry.date >= startDate && entry.date <= endDate
  );

  const cashFlowStatement: CashFlowStatement = {
    operating: {
      netIncome: 0,
      adjustments: {
        depreciation: 0,
        accountsReceivable: 0,
        inventory: 0,
        accountsPayable: 0,
        accruedExpenses: 0,
      },
      netCashFromOperations: 0,
    },
    investing: {
      propertyPurchase: 0,
      equipmentPurchase: 0,
      vehiclePurchase: 0,
      otherInvestments: 0,
    },
    financing: {
      loanProceeds: 0,
      loanPayments: 0,
      capitalContributions: 0,
      dividends: 0,
    },
    netChangeInCash: 0,
    beginningCash: 0,
    endingCash: 0,
  };

  // Get beginning cash balance
  const beginningEntries = entries.filter((entry) => entry.date < startDate);
  cashFlowStatement.beginningCash = beginningEntries.reduce((balance, entry) => {
    if (entry.category === 'cash') {
      return balance + (entry.type === 'debit' ? entry.amount : -entry.amount);
    }
    return balance;
  }, 0);

  // Process entries to calculate cash flow statement values
  filteredEntries.forEach((entry) => {
    const amount = entry.type === 'debit' ? entry.amount : -entry.amount;

    // Map categories to cash flow statement accounts
    switch (entry.category) {
      // Operating Activities
      case 'depreciation':
        cashFlowStatement.operating.adjustments.depreciation += amount;
        break;
      case 'accounts_receivable':
        cashFlowStatement.operating.adjustments.accountsReceivable += amount;
        break;
      case 'inventory':
        cashFlowStatement.operating.adjustments.inventory += amount;
        break;
      case 'accounts_payable':
        cashFlowStatement.operating.adjustments.accountsPayable += amount;
        break;
      case 'accrued_expenses':
        cashFlowStatement.operating.adjustments.accruedExpenses += amount;
        break;

      // Investing Activities
      case 'property':
        cashFlowStatement.investing.propertyPurchase += amount;
        break;
      case 'equipment':
        cashFlowStatement.investing.equipmentPurchase += amount;
        break;
      case 'vehicles':
        cashFlowStatement.investing.vehiclePurchase += amount;
        break;
      case 'other_fixed_assets':
        cashFlowStatement.investing.otherInvestments += amount;
        break;

      // Financing Activities
      case 'short_term_loans':
      case 'long_term_loans':
      case 'mortgages':
        if (amount > 0) {
          cashFlowStatement.financing.loanProceeds += amount;
        } else {
          cashFlowStatement.financing.loanPayments += -amount;
        }
        break;
      case 'common_stock':
      case 'additional_paid_in_capital':
        cashFlowStatement.financing.capitalContributions += amount;
        break;
      case 'dividends':
        cashFlowStatement.financing.dividends += -amount;
        break;
    }
  });

  // Calculate net income from income statement
  const incomeStatement = await generateIncomeStatement(entries, startDate, endDate);
  cashFlowStatement.operating.netIncome = incomeStatement.netIncome;

  // Calculate net cash from operations
  cashFlowStatement.operating.netCashFromOperations =
    cashFlowStatement.operating.netIncome +
    cashFlowStatement.operating.adjustments.depreciation +
    cashFlowStatement.operating.adjustments.accountsReceivable +
    cashFlowStatement.operating.adjustments.inventory +
    cashFlowStatement.operating.adjustments.accountsPayable +
    cashFlowStatement.operating.adjustments.accruedExpenses;

  // Calculate net change in cash
  cashFlowStatement.netChangeInCash =
    cashFlowStatement.operating.netCashFromOperations +
    Object.values(cashFlowStatement.investing).reduce((sum, value) => sum + value, 0) +
    Object.values(cashFlowStatement.financing).reduce((sum, value) => sum + value, 0);

  // Calculate ending cash balance
  cashFlowStatement.endingCash =
    cashFlowStatement.beginningCash + cashFlowStatement.netChangeInCash;

  return cashFlowStatement;
} 