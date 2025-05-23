import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { BalanceSheet, IncomeStatement, CashFlowStatement } from '@smart-accounting/shared/types/accounting';
import { formatCurrency } from './formatters';

export const exportToExcel = (
  data: BalanceSheet | IncomeStatement | CashFlowStatement,
  type: 'balance_sheet' | 'income_statement' | 'cash_flow',
  startDate: Date,
  endDate: Date
) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([['']]);

  // Add header
  XLSX.utils.sheet_add_aoa(worksheet, [
    [`${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`],
    [`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
    [''],
  ]);

  let rows: (string | number)[][] = [];

  switch (type) {
    case 'balance_sheet':
      const bs = data as BalanceSheet;
      rows = [
        ['Assets'],
        ['Current Assets'],
        ['Cash', formatCurrency(bs.assets.current.cash)],
        ['Accounts Receivable', formatCurrency(bs.assets.current.accountsReceivable)],
        ['Inventory', formatCurrency(bs.assets.current.inventory)],
        ['Prepaid Expenses', formatCurrency(bs.assets.current.prepaidExpenses)],
        ['Other Current Assets', formatCurrency(bs.assets.current.otherCurrentAssets)],
        [''],
        ['Fixed Assets'],
        ['Property', formatCurrency(bs.assets.fixed.property)],
        ['Equipment', formatCurrency(bs.assets.fixed.equipment)],
        ['Vehicles', formatCurrency(bs.assets.fixed.vehicles)],
        ['Other Fixed Assets', formatCurrency(bs.assets.fixed.otherFixedAssets)],
        [''],
        ['Other Assets'],
        ['Investments', formatCurrency(bs.assets.other.investments)],
        ['Intangible Assets', formatCurrency(bs.assets.other.intangibleAssets)],
        ['Other Assets', formatCurrency(bs.assets.other.otherAssets)],
        [''],
        ['Liabilities'],
        ['Current Liabilities'],
        ['Accounts Payable', formatCurrency(bs.liabilities.current.accountsPayable)],
        ['Short-term Loans', formatCurrency(bs.liabilities.current.shortTermLoans)],
        ['Accrued Expenses', formatCurrency(bs.liabilities.current.accruedExpenses)],
        ['Other Current Liabilities', formatCurrency(bs.liabilities.current.otherCurrentLiabilities)],
        [''],
        ['Long-term Liabilities'],
        ['Long-term Loans', formatCurrency(bs.liabilities.longTerm.longTermLoans)],
        ['Bonds', formatCurrency(bs.liabilities.longTerm.bonds)],
        ['Other Long-term Liabilities', formatCurrency(bs.liabilities.longTerm.otherLongTermLiabilities)],
        [''],
        ['Equity'],
        ['Common Stock', formatCurrency(bs.equity.commonStock)],
        ['Retained Earnings', formatCurrency(bs.equity.retainedEarnings)],
        ['Other Equity', formatCurrency(bs.equity.otherEquity)],
      ];
      break;

    case 'income_statement':
      const is = data as IncomeStatement;
      rows = [
        ['Revenue'],
        ['Sales', formatCurrency(is.revenue.sales)],
        ['Service', formatCurrency(is.revenue.service)],
        ['Other Revenue', formatCurrency(is.revenue.other)],
        [''],
        ['Cost of Goods Sold', formatCurrency(is.costOfGoodsSold)],
        ['Gross Profit', formatCurrency(is.grossProfit)],
        [''],
        ['Operating Expenses'],
        ['Salaries', formatCurrency(is.operatingExpenses.salaries)],
        ['Rent', formatCurrency(is.operatingExpenses.rent)],
        ['Utilities', formatCurrency(is.operatingExpenses.utilities)],
        ['Marketing', formatCurrency(is.operatingExpenses.marketing)],
        ['Depreciation', formatCurrency(is.operatingExpenses.depreciation)],
        ['Other Expenses', formatCurrency(is.operatingExpenses.other)],
        [''],
        ['Operating Income', formatCurrency(is.operatingIncome)],
        [''],
        ['Other Income/Expenses'],
        ['Other Income', formatCurrency(is.otherIncome)],
        ['Other Expenses', formatCurrency(is.otherExpenses)],
        [''],
        ['Net Income', formatCurrency(is.netIncome)],
      ];
      break;

    case 'cash_flow':
      const cfs = data as CashFlowStatement;
      rows = [
        ['Operating Activities'],
        ['Net Income', formatCurrency(cfs.operating.netIncome)],
        ['Adjustments:'],
        ['Depreciation', formatCurrency(cfs.operating.adjustments.depreciation)],
        ['Accounts Receivable', formatCurrency(cfs.operating.adjustments.accountsReceivable)],
        ['Inventory', formatCurrency(cfs.operating.adjustments.inventory)],
        ['Accounts Payable', formatCurrency(cfs.operating.adjustments.accountsPayable)],
        ['Other Adjustments', formatCurrency(cfs.operating.adjustments.other)],
        ['Net Cash from Operations', formatCurrency(cfs.operating.netCashFromOperations)],
        [''],
        ['Investing Activities'],
        ['Purchase of Assets', formatCurrency(cfs.investing.purchaseOfAssets)],
        ['Sale of Assets', formatCurrency(cfs.investing.saleOfAssets)],
        ['Investments', formatCurrency(cfs.investing.investments)],
        ['Other Investing', formatCurrency(cfs.investing.other)],
        ['Net Cash from Investing', formatCurrency(cfs.investing.netCashFromInvesting)],
        [''],
        ['Financing Activities'],
        ['Loans', formatCurrency(cfs.financing.loans)],
        ['Repayments', formatCurrency(cfs.financing.repayments)],
        ['Dividends', formatCurrency(cfs.financing.dividends)],
        ['Other Financing', formatCurrency(cfs.financing.other)],
        ['Net Cash from Financing', formatCurrency(cfs.financing.netCashFromFinancing)],
        [''],
        ['Cash Summary'],
        ['Net Change in Cash', formatCurrency(cfs.netChangeInCash)],
        ['Beginning Cash', formatCurrency(cfs.beginningCash)],
        ['Ending Cash', formatCurrency(cfs.endingCash)],
      ];
      break;
  }

  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A4' });
  XLSX.utils.book_append_sheet(workbook, worksheet, type);
  XLSX.writeFile(workbook, `${type}_${startDate.toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (
  data: BalanceSheet | IncomeStatement | CashFlowStatement,
  type: 'balance_sheet' | 'income_statement' | 'cash_flow',
  startDate: Date,
  endDate: Date
) => {
  const doc = new jsPDF();
  const title = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  
  // Add header
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 25);

  let tableData: (string | number)[][] = [];
  let tableConfig: any = {
    head: [['Item', 'Amount']],
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
  };

  switch (type) {
    case 'balance_sheet':
      const bs = data as BalanceSheet;
      tableData = [
        ['ASSETS', ''],
        ['Current Assets', ''],
        ['Cash', bs.assets.current.cash],
        ['Accounts Receivable', bs.assets.current.accountsReceivable],
        ['Inventory', bs.assets.current.inventory],
        ['Prepaid Expenses', bs.assets.current.prepaidExpenses],
        ['Other Current Assets', bs.assets.current.otherCurrentAssets],
        ['Fixed Assets', ''],
        ['Property', bs.assets.fixed.property],
        ['Equipment', bs.assets.fixed.equipment],
        ['Vehicles', bs.assets.fixed.vehicles],
        ['Other Fixed Assets', bs.assets.fixed.otherFixedAssets],
        ['Other Assets', ''],
        ['Investments', bs.assets.other.investments],
        ['Intangible Assets', bs.assets.other.intangibleAssets],
        ['Other Assets', bs.assets.other.otherAssets],
        ['LIABILITIES', ''],
        ['Current Liabilities', ''],
        ['Accounts Payable', bs.liabilities.current.accountsPayable],
        ['Short-term Loans', bs.liabilities.current.shortTermLoans],
        ['Accrued Expenses', bs.liabilities.current.accruedExpenses],
        ['Other Current Liabilities', bs.liabilities.current.otherCurrentLiabilities],
        ['Long-term Liabilities', ''],
        ['Long-term Loans', bs.liabilities.longTerm.longTermLoans],
        ['Bonds', bs.liabilities.longTerm.bonds],
        ['Other Long-term Liabilities', bs.liabilities.longTerm.otherLongTermLiabilities],
        ['EQUITY', ''],
        ['Common Stock', bs.equity.commonStock],
        ['Retained Earnings', bs.equity.retainedEarnings],
        ['Other Equity', bs.equity.otherEquity],
      ];
      break;

    case 'income_statement':
      const is = data as IncomeStatement;
      tableData = [
        ['REVENUE', ''],
        ['Sales', is.revenue.sales],
        ['Service', is.revenue.service],
        ['Other Revenue', is.revenue.other],
        ['Cost of Goods Sold', is.costOfGoodsSold],
        ['Gross Profit', is.grossProfit],
        ['OPERATING EXPENSES', ''],
        ['Salaries', is.operatingExpenses.salaries],
        ['Rent', is.operatingExpenses.rent],
        ['Utilities', is.operatingExpenses.utilities],
        ['Marketing', is.operatingExpenses.marketing],
        ['Depreciation', is.operatingExpenses.depreciation],
        ['Other Expenses', is.operatingExpenses.other],
        ['Operating Income', is.operatingIncome],
        ['OTHER INCOME/EXPENSES', ''],
        ['Other Income', is.otherIncome],
        ['Other Expenses', is.otherExpenses],
        ['Net Income', is.netIncome],
      ];
      break;

    case 'cash_flow':
      const cfs = data as CashFlowStatement;
      tableData = [
        ['OPERATING ACTIVITIES', ''],
        ['Net Income', cfs.operating.netIncome],
        ['Adjustments:', ''],
        ['Depreciation', cfs.operating.adjustments.depreciation],
        ['Accounts Receivable', cfs.operating.adjustments.accountsReceivable],
        ['Inventory', cfs.operating.adjustments.inventory],
        ['Accounts Payable', cfs.operating.adjustments.accountsPayable],
        ['Other Adjustments', cfs.operating.adjustments.other],
        ['Net Cash from Operations', cfs.operating.netCashFromOperations],
        ['INVESTING ACTIVITIES', ''],
        ['Purchase of Assets', cfs.investing.purchaseOfAssets],
        ['Sale of Assets', cfs.investing.saleOfAssets],
        ['Investments', cfs.investing.investments],
        ['Other Investing', cfs.investing.other],
        ['Net Cash from Investing', cfs.investing.netCashFromInvesting],
        ['FINANCING ACTIVITIES', ''],
        ['Loans', cfs.financing.loans],
        ['Repayments', cfs.financing.repayments],
        ['Dividends', cfs.financing.dividends],
        ['Other Financing', cfs.financing.other],
        ['Net Cash from Financing', cfs.financing.netCashFromFinancing],
        ['CASH SUMMARY', ''],
        ['Net Change in Cash', cfs.netChangeInCash],
        ['Beginning Cash', cfs.beginningCash],
        ['Ending Cash', cfs.endingCash],
      ];
      break;
  }

  // Format the data
  tableData = tableData.map(row => [
    row[0],
    typeof row[1] === 'number' ? formatCurrency(row[1]) : row[1]
  ]);

  (doc as any).autoTable(tableConfig);
  (doc as any).autoTable({
    ...tableConfig,
    body: tableData,
  });

  doc.save(`${type}_${startDate.toISOString().split('T')[0]}.pdf`);
}; 