import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FuelSale, Expense, StockItem } from '../types/petrolStation';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headerStyle?: XLSX.CellStyle;
  dataStyle?: XLSX.CellStyle;
}

export class ExcelExportUtil {
  private static instance: ExcelExportUtil;

  private constructor() {}

  public static getInstance(): ExcelExportUtil {
    if (!ExcelExportUtil.instance) {
      ExcelExportUtil.instance = new ExcelExportUtil();
    }
    return ExcelExportUtil.instance;
  }

  public exportToExcel<T extends object>(
    data: T[],
    options: ExcelExportOptions
  ): void {
    try {
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Apply styles if provided
      if (options.headerStyle) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = XLSX.utils.encode_cell({ r: 0, c: C });
          if (!worksheet[cell]) continue;
          worksheet[cell].s = options.headerStyle;
        }
      }

      if (options.dataStyle) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = XLSX.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cell]) continue;
            worksheet[cell].s = options.dataStyle;
          }
        }
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        options.sheetName || 'Sheet1'
      );

      // Generate buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      // Convert to blob and save
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `${options.filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  public exportMultipleSheets<T extends object>(
    sheets: { data: T[]; name: string }[],
    options: ExcelExportOptions
  ): void {
    try {
      const workbook = XLSX.utils.book_new();

      sheets.forEach((sheet) => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });

      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `${options.filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting multiple sheets to Excel:', error);
      throw error;
    }
  }

  public generateExcelTemplate<T extends object>(
    headers: (keyof T)[],
    options: ExcelExportOptions
  ): void {
    try {
      const templateData = [Object.fromEntries(headers.map((h) => [h, '']))];
      this.exportToExcel(templateData, options);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      throw error;
    }
  }
}

export const exportToExcel = (
  data: FuelSale[] | Expense[] | StockItem[],
  options: ExcelExportOptions
) => {
  const { filename, sheetName = 'Sheet1' } = options;

  // Convert data to worksheet format
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => {
      if ('totalAmount' in item) {
        // FuelSale
        return {
          'Fuel Type': item.fuelType,
          'Quantity (L)': item.quantity,
          'Price per Liter': item.pricePerLiter,
          'Total Amount': item.totalAmount,
          'Payment Method': item.paymentMethod,
          'Timestamp': item.timestamp.toLocaleString(),
        };
      } else if ('amount' in item) {
        // Expense
        return {
          'Category': item.category,
          'Amount': item.amount,
          'Description': item.description,
          'Timestamp': item.timestamp.toLocaleString(),
        };
      } else {
        // StockItem
        return {
          'Name': item.name,
          'Quantity': item.quantity,
          'Unit': item.unit,
          'Minimum Quantity': item.minimumQuantity,
          'Last Updated': item.lastUpdated.toLocaleString(),
          'Notes': item.notes,
        };
      }
    })
  );

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToExcelMobile = async (
  data: FuelSale[] | Expense[] | StockItem[],
  options: ExcelExportOptions
) => {
  const { filename, sheetName = 'Sheet1' } = options;

  // Convert data to worksheet format
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => {
      if ('totalAmount' in item) {
        // FuelSale
        return {
          'Fuel Type': item.fuelType,
          'Quantity (L)': item.quantity,
          'Price per Liter': item.pricePerLiter,
          'Total Amount': item.totalAmount,
          'Payment Method': item.paymentMethod,
          'Timestamp': item.timestamp.toLocaleString(),
        };
      } else if ('amount' in item) {
        // Expense
        return {
          'Category': item.category,
          'Amount': item.amount,
          'Description': item.description,
          'Timestamp': item.timestamp.toLocaleString(),
        };
      } else {
        // StockItem
        return {
          'Name': item.name,
          'Quantity': item.quantity,
          'Unit': item.unit,
          'Minimum Quantity': item.minimumQuantity,
          'Last Updated': item.lastUpdated.toLocaleString(),
          'Notes': item.notes,
        };
      }
    })
  );

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file as base64 string
  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  return wbout;
};

export class ExcelExportService {
  async exportFinancialReport(data: any) {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Overview Sheet
      const overviewData = [
        ['Financial Overview'],
        [''],
        ['Total Revenue', `$${data.totalRevenue.toLocaleString()}`],
        ['Total Expenses', `$${data.totalExpenses.toLocaleString()}`],
        ['Net Profit', `$${data.netProfit.toLocaleString()}`],
        [''],
        ['Revenue vs Expenses by Month'],
        ['Month', 'Revenue', 'Expenses'],
        ...data.revenueVsExpenses.map((item: any) => [
          item.month,
          `$${item.revenue.toLocaleString()}`,
          `$${item.expenses.toLocaleString()}`,
        ]),
      ];

      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

      // Income Statement Sheet
      const incomeStatementData = [
        ['Income Statement'],
        [''],
        ['Category', 'Amount'],
        ...data.incomeStatement.map((item: any) => [
          item.category,
          `$${Math.abs(item.amount).toLocaleString()}`,
        ]),
      ];

      const incomeStatementSheet = XLSX.utils.aoa_to_sheet(incomeStatementData);
      XLSX.utils.book_append_sheet(wb, incomeStatementSheet, 'Income Statement');

      // Balance Sheet
      const balanceSheetData = [
        ['Balance Sheet'],
        [''],
        ['Assets'],
        ['Item', 'Value'],
        ...data.balanceSheet.assets.map((item: any) => [
          item.name,
          `$${item.value.toLocaleString()}`,
        ]),
        [''],
        ['Liabilities'],
        ['Item', 'Value'],
        ...data.balanceSheet.liabilities.map((item: any) => [
          item.name,
          `$${item.value.toLocaleString()}`,
        ]),
      ];

      const balanceSheetSheet = XLSX.utils.aoa_to_sheet(balanceSheetData);
      XLSX.utils.book_append_sheet(wb, balanceSheetSheet, 'Balance Sheet');

      // Cash Flow Statement
      const cashFlowData = [
        ['Cash Flow Statement'],
        [''],
        ['Category', 'Amount'],
        ...data.cashFlow.map((item: any) => [
          item.category,
          `$${Math.abs(item.amount).toLocaleString()}`,
        ]),
      ];

      const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowData);
      XLSX.utils.book_append_sheet(wb, cashFlowSheet, 'Cash Flow');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  async exportFuelShiftExpenses(data: any) {
    try {
      const wb = XLSX.utils.book_new();

      // Fuel Sales Sheet
      const fuelSalesData = [
        ['Fuel Sales Report'],
        [''],
        ['Date', 'Fuel Type', 'Volume (L)', 'Price/L', 'Total Amount', 'Payment Method'],
        ...data.fuelSales.map((sale: any) => [
          new Date(sale.timestamp.toDate()).toLocaleDateString(),
          sale.fuelType,
          sale.volume.toFixed(2),
          `$${sale.pricePerLiter.toFixed(2)}`,
          `$${sale.totalAmount.toFixed(2)}`,
          sale.paymentMethod,
        ]),
      ];

      const fuelSalesSheet = XLSX.utils.aoa_to_sheet(fuelSalesData);
      XLSX.utils.book_append_sheet(wb, fuelSalesSheet, 'Fuel Sales');

      // Expenses Sheet
      const expensesData = [
        ['Expenses Report'],
        [''],
        ['Date', 'Category', 'Description', 'Amount', 'Payment Method'],
        ...data.expenses.map((expense: any) => [
          new Date(expense.date.toDate()).toLocaleDateString(),
          expense.category,
          expense.description,
          `$${expense.amount.toFixed(2)}`,
          expense.paymentMethod,
        ]),
      ];

      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');

      // Summary Sheet
      const summaryData = [
        ['Shift Summary'],
        [''],
        ['Total Fuel Sales', `$${data.totalFuelSales.toFixed(2)}`],
        ['Total Expenses', `$${data.totalExpenses.toFixed(2)}`],
        ['Net Amount', `$${data.netAmount.toFixed(2)}`],
        [''],
        ['Fuel Sales by Type'],
        ['Fuel Type', 'Volume (L)', 'Amount'],
        ...Object.entries(data.fuelSalesByType).map(([type, data]: [string, any]) => [
          type,
          data.volume.toFixed(2),
          `$${data.amount.toFixed(2)}`,
        ]),
        [''],
        ['Expenses by Category'],
        ['Category', 'Amount'],
        ...Object.entries(data.expensesByCategory).map(([category, amount]: [string, number]) => [
          category,
          `$${amount.toFixed(2)}`,
        ]),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shift_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting shift report to Excel:', error);
      throw error;
    }
  }
} 