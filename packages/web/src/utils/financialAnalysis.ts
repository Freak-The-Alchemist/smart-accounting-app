import { BalanceSheet, IncomeStatement, CashFlowStatement } from '@smart-accounting/shared/types/accounting';

export interface FinancialRatios {
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
}

export const calculateFinancialRatios = (
  balanceSheet: BalanceSheet,
  incomeStatement: IncomeStatement,
  cashFlowStatement: CashFlowStatement
): FinancialRatios => {
  // Calculate total current assets
  const totalCurrentAssets = 
    balanceSheet.assets.current.cash +
    balanceSheet.assets.current.accountsReceivable +
    balanceSheet.assets.current.inventory +
    balanceSheet.assets.current.prepaidExpenses +
    balanceSheet.assets.current.otherCurrentAssets;

  // Calculate total current liabilities
  const totalCurrentLiabilities = 
    balanceSheet.liabilities.current.accountsPayable +
    balanceSheet.liabilities.current.shortTermLoans +
    balanceSheet.liabilities.current.accruedExpenses +
    balanceSheet.liabilities.current.otherCurrentLiabilities;

  // Calculate total assets
  const totalAssets = 
    totalCurrentAssets +
    balanceSheet.assets.fixed.property +
    balanceSheet.assets.fixed.equipment +
    balanceSheet.assets.fixed.vehicles +
    balanceSheet.assets.fixed.otherFixedAssets +
    balanceSheet.assets.other.investments +
    balanceSheet.assets.other.intangibleAssets +
    balanceSheet.assets.other.otherAssets;

  // Calculate total liabilities
  const totalLiabilities = 
    totalCurrentLiabilities +
    balanceSheet.liabilities.longTerm.longTermLoans +
    balanceSheet.liabilities.longTerm.bonds +
    balanceSheet.liabilities.longTerm.otherLongTermLiabilities;

  // Calculate total equity
  const totalEquity = 
    balanceSheet.equity.commonStock +
    balanceSheet.equity.retainedEarnings +
    balanceSheet.equity.otherEquity;

  // Calculate total revenue
  const totalRevenue = 
    incomeStatement.revenue.sales +
    incomeStatement.revenue.service +
    incomeStatement.revenue.other;

  // Calculate total operating expenses
  const totalOperatingExpenses = 
    incomeStatement.operatingExpenses.salaries +
    incomeStatement.operatingExpenses.rent +
    incomeStatement.operatingExpenses.utilities +
    incomeStatement.operatingExpenses.marketing +
    incomeStatement.operatingExpenses.depreciation +
    incomeStatement.operatingExpenses.other;

  return {
    liquidity: {
      // Current Ratio = Current Assets / Current Liabilities
      currentRatio: totalCurrentAssets / totalCurrentLiabilities,
      
      // Quick Ratio = (Current Assets - Inventory) / Current Liabilities
      quickRatio: (totalCurrentAssets - balanceSheet.assets.current.inventory) / totalCurrentLiabilities,
      
      // Cash Ratio = Cash / Current Liabilities
      cashRatio: balanceSheet.assets.current.cash / totalCurrentLiabilities,
    },
    profitability: {
      // Gross Profit Margin = Gross Profit / Revenue
      grossProfitMargin: incomeStatement.grossProfit / totalRevenue,
      
      // Operating Profit Margin = Operating Income / Revenue
      operatingProfitMargin: incomeStatement.operatingIncome / totalRevenue,
      
      // Net Profit Margin = Net Income / Revenue
      netProfitMargin: incomeStatement.netIncome / totalRevenue,
      
      // Return on Assets (ROA) = Net Income / Total Assets
      returnOnAssets: incomeStatement.netIncome / totalAssets,
      
      // Return on Equity (ROE) = Net Income / Total Equity
      returnOnEquity: incomeStatement.netIncome / totalEquity,
    },
    efficiency: {
      // Asset Turnover = Revenue / Total Assets
      assetTurnover: totalRevenue / totalAssets,
      
      // Inventory Turnover = Cost of Goods Sold / Average Inventory
      inventoryTurnover: incomeStatement.costOfGoodsSold / balanceSheet.assets.current.inventory,
      
      // Receivables Turnover = Revenue / Accounts Receivable
      receivablesTurnover: totalRevenue / balanceSheet.assets.current.accountsReceivable,
    },
    leverage: {
      // Debt to Equity = Total Liabilities / Total Equity
      debtToEquity: totalLiabilities / totalEquity,
      
      // Debt to Assets = Total Liabilities / Total Assets
      debtToAssets: totalLiabilities / totalAssets,
      
      // Interest Coverage = Operating Income / Interest Expense
      interestCoverage: incomeStatement.operatingIncome / (totalLiabilities * 0.05), // Assuming 5% interest rate
    },
  };
};

export const getRatioAnalysis = (ratios: FinancialRatios): { [key: string]: { value: number; analysis: string } } => {
  const analysis: { [key: string]: { value: number; analysis: string } } = {};

  // Liquidity Ratios Analysis
  analysis.currentRatio = {
    value: ratios.liquidity.currentRatio,
    analysis: ratios.liquidity.currentRatio > 2
      ? 'Strong liquidity position'
      : ratios.liquidity.currentRatio > 1
        ? 'Adequate liquidity'
        : 'Potential liquidity concerns',
  };

  analysis.quickRatio = {
    value: ratios.liquidity.quickRatio,
    analysis: ratios.liquidity.quickRatio > 1
      ? 'Good short-term liquidity'
      : ratios.liquidity.quickRatio > 0.5
        ? 'Moderate short-term liquidity'
        : 'Limited short-term liquidity',
  };

  analysis.cashRatio = {
    value: ratios.liquidity.cashRatio,
    analysis: ratios.liquidity.cashRatio > 0.5
      ? 'Strong cash position'
      : ratios.liquidity.cashRatio > 0.2
        ? 'Adequate cash position'
        : 'Limited cash reserves',
  };

  // Profitability Ratios Analysis
  analysis.grossProfitMargin = {
    value: ratios.profitability.grossProfitMargin,
    analysis: ratios.profitability.grossProfitMargin > 0.4
      ? 'Excellent gross profit margin'
      : ratios.profitability.grossProfitMargin > 0.2
        ? 'Good gross profit margin'
        : 'Low gross profit margin',
  };

  analysis.operatingProfitMargin = {
    value: ratios.profitability.operatingProfitMargin,
    analysis: ratios.profitability.operatingProfitMargin > 0.2
      ? 'Strong operating efficiency'
      : ratios.profitability.operatingProfitMargin > 0.1
        ? 'Moderate operating efficiency'
        : 'Low operating efficiency',
  };

  analysis.netProfitMargin = {
    value: ratios.profitability.netProfitMargin,
    analysis: ratios.profitability.netProfitMargin > 0.15
      ? 'Excellent profitability'
      : ratios.profitability.netProfitMargin > 0.05
        ? 'Good profitability'
        : 'Low profitability',
  };

  analysis.returnOnAssets = {
    value: ratios.profitability.returnOnAssets,
    analysis: ratios.profitability.returnOnAssets > 0.1
      ? 'Efficient asset utilization'
      : ratios.profitability.returnOnAssets > 0.05
        ? 'Moderate asset utilization'
        : 'Inefficient asset utilization',
  };

  analysis.returnOnEquity = {
    value: ratios.profitability.returnOnEquity,
    analysis: ratios.profitability.returnOnEquity > 0.15
      ? 'Excellent return on equity'
      : ratios.profitability.returnOnEquity > 0.1
        ? 'Good return on equity'
        : 'Low return on equity',
  };

  // Efficiency Ratios Analysis
  analysis.assetTurnover = {
    value: ratios.efficiency.assetTurnover,
    analysis: ratios.efficiency.assetTurnover > 1
      ? 'Efficient asset utilization'
      : ratios.efficiency.assetTurnover > 0.5
        ? 'Moderate asset utilization'
        : 'Inefficient asset utilization',
  };

  analysis.inventoryTurnover = {
    value: ratios.efficiency.inventoryTurnover,
    analysis: ratios.efficiency.inventoryTurnover > 5
      ? 'Efficient inventory management'
      : ratios.efficiency.inventoryTurnover > 2
        ? 'Moderate inventory management'
        : 'Inefficient inventory management',
  };

  analysis.receivablesTurnover = {
    value: ratios.efficiency.receivablesTurnover,
    analysis: ratios.efficiency.receivablesTurnover > 10
      ? 'Efficient receivables collection'
      : ratios.efficiency.receivablesTurnover > 5
        ? 'Moderate receivables collection'
        : 'Inefficient receivables collection',
  };

  // Leverage Ratios Analysis
  analysis.debtToEquity = {
    value: ratios.leverage.debtToEquity,
    analysis: ratios.leverage.debtToEquity < 1
      ? 'Conservative leverage'
      : ratios.leverage.debtToEquity < 2
        ? 'Moderate leverage'
        : 'High leverage',
  };

  analysis.debtToAssets = {
    value: ratios.leverage.debtToAssets,
    analysis: ratios.leverage.debtToAssets < 0.4
      ? 'Low debt burden'
      : ratios.leverage.debtToAssets < 0.6
        ? 'Moderate debt burden'
        : 'High debt burden',
  };

  analysis.interestCoverage = {
    value: ratios.leverage.interestCoverage,
    analysis: ratios.leverage.interestCoverage > 3
      ? 'Strong interest coverage'
      : ratios.leverage.interestCoverage > 1.5
        ? 'Adequate interest coverage'
        : 'Weak interest coverage',
  };

  return analysis;
}; 