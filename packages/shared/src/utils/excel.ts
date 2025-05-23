import * as XLSX from 'xlsx';
import { FuelSale, Shift, Expense, DailyReport } from '../types/petrolStation';
import { formatCurrency, formatDate } from './format';

interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  data: any[];
  columns: {
    header: string;
    key: string;
    width?: number;
  }[];
}

export function exportToExcel({
  filename,
  sheetName = 'Sheet1',
  data,
  columns,
}: ExcelExportOptions) {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const columnWidths = columns.reduce((acc, col) => {
    acc[col.key] = { wch: col.width || 15 };
    return acc;
  }, {} as Record<string, { wch: number }>);
  worksheet['!cols'] = columns.map(col => columnWidths[col.key]);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function generateFuelSalesReport(sales: FuelSale[]) {
  const data = sales.map(sale => ({
    'Timestamp': formatDate(sale.timestamp),
    'Fuel Type': sale.fuelType,
    'Liters': sale.liters,
    'Price per Liter': formatCurrency(sale.pricePerLiter),
    'Total Amount': formatCurrency(sale.totalAmount),
    'Payment Method': sale.paymentMethod,
    'Attendant ID': sale.attendantId,
    'Shift ID': sale.shiftId,
  }));

  return {
    filename: `fuel-sales-report-${formatDate(new Date())}`,
    sheetName: 'Fuel Sales',
    data,
    columns: [
      { header: 'Timestamp', key: 'Timestamp', width: 20 },
      { header: 'Fuel Type', key: 'Fuel Type', width: 15 },
      { header: 'Liters', key: 'Liters', width: 15 },
      { header: 'Price per Liter', key: 'Price per Liter', width: 15 },
      { header: 'Total Amount', key: 'Total Amount', width: 15 },
      { header: 'Payment Method', key: 'Payment Method', width: 15 },
      { header: 'Attendant ID', key: 'Attendant ID', width: 20 },
      { header: 'Shift ID', key: 'Shift ID', width: 20 },
    ],
  };
}

export function generateShiftReport(shift: Shift, sales: FuelSale[], expenses: Expense[]) {
  const shiftData = [{
    'Shift ID': shift.id,
    'Attendant ID': shift.attendantId,
    'Start Time': formatDate(shift.startTime),
    'End Time': shift.endTime ? formatDate(shift.endTime) : 'Active',
    'Status': shift.status,
    'Opening Balance': formatCurrency(shift.openingBalance),
    'Closing Balance': shift.closingBalance ? formatCurrency(shift.closingBalance) : '',
    'Total Sales': formatCurrency(shift.totalSales),
    'Total Expenses': formatCurrency(shift.totalExpenses),
    'Notes': shift.notes || '',
  }];

  const salesData = sales.map(sale => ({
    'Timestamp': formatDate(sale.timestamp),
    'Fuel Type': sale.fuelType,
    'Liters': sale.liters,
    'Price per Liter': formatCurrency(sale.pricePerLiter),
    'Total Amount': formatCurrency(sale.totalAmount),
    'Payment Method': sale.paymentMethod,
    'Attendant ID': sale.attendantId,
    'Shift ID': sale.shiftId,
  }));

  const expensesData = expenses.map(expense => ({
    'Timestamp': formatDate(expense.timestamp),
    'Description': expense.description,
    'Category': expense.category,
    'Amount': formatCurrency(expense.amount),
    'Attendant ID': expense.attendantId,
    'Shift ID': expense.shiftId,
  }));

  return {
    filename: `shift-report-${shift.id}`,
    sheets: [
      {
        name: 'Shift Summary',
        data: shiftData,
        columns: [
          { header: 'Shift ID', key: 'Shift ID', width: 20 },
          { header: 'Attendant ID', key: 'Attendant ID', width: 20 },
          { header: 'Start Time', key: 'Start Time', width: 20 },
          { header: 'End Time', key: 'End Time', width: 20 },
          { header: 'Status', key: 'Status', width: 15 },
          { header: 'Opening Balance', key: 'Opening Balance', width: 15 },
          { header: 'Closing Balance', key: 'Closing Balance', width: 15 },
          { header: 'Total Sales', key: 'Total Sales', width: 15 },
          { header: 'Total Expenses', key: 'Total Expenses', width: 15 },
          { header: 'Notes', key: 'Notes', width: 30 },
        ],
      },
      {
        name: 'Sales',
        data: salesData,
        columns: [
          { header: 'Timestamp', key: 'Timestamp', width: 20 },
          { header: 'Fuel Type', key: 'Fuel Type', width: 15 },
          { header: 'Liters', key: 'Liters', width: 15 },
          { header: 'Price per Liter', key: 'Price per Liter', width: 15 },
          { header: 'Total Amount', key: 'Total Amount', width: 15 },
          { header: 'Payment Method', key: 'Payment Method', width: 15 },
          { header: 'Attendant ID', key: 'Attendant ID', width: 20 },
          { header: 'Shift ID', key: 'Shift ID', width: 20 },
        ],
      },
      {
        name: 'Expenses',
        data: expensesData,
        columns: [
          { header: 'Timestamp', key: 'Timestamp', width: 20 },
          { header: 'Description', key: 'Description', width: 30 },
          { header: 'Category', key: 'Category', width: 15 },
          { header: 'Amount', key: 'Amount', width: 15 },
          { header: 'Attendant ID', key: 'Attendant ID', width: 20 },
          { header: 'Shift ID', key: 'Shift ID', width: 20 },
        ],
      },
    ],
  };
}

export function generateDailyReport(report: DailyReport) {
  const data = [{
    'Date': formatDate(report.date),
    'Total Fuel Sales': formatCurrency(report.totalFuelSales),
    'Total Expenses': formatCurrency(report.totalExpenses),
    'Net Income': formatCurrency(report.netIncome),
  }];

  const fuelSalesData = Object.entries(report.fuelSalesByType).map(([type, amount]) => ({
    'Fuel Type': type,
    'Amount': formatCurrency(amount),
  }));

  const expensesByCategoryData = Object.entries(report.expensesByCategory).map(([category, amount]) => ({
    'Category': category,
    'Amount': formatCurrency(amount),
  }));

  return {
    filename: `daily-report-${formatDate(report.date)}`,
    sheets: [
      {
        name: 'Summary',
        data,
        columns: [
          { header: 'Date', key: 'Date', width: 20 },
          { header: 'Total Fuel Sales', key: 'Total Fuel Sales', width: 15 },
          { header: 'Total Expenses', key: 'Total Expenses', width: 15 },
          { header: 'Net Income', key: 'Net Income', width: 15 },
        ],
      },
      {
        name: 'Fuel Sales By Type',
        data: fuelSalesData,
        columns: [
          { header: 'Fuel Type', key: 'Fuel Type', width: 15 },
          { header: 'Amount', key: 'Amount', width: 15 },
        ],
      },
      {
        name: 'Expenses By Category',
        data: expensesByCategoryData,
        columns: [
          { header: 'Category', key: 'Category', width: 15 },
          { header: 'Amount', key: 'Amount', width: 15 },
        ],
      },
    ],
  };
}