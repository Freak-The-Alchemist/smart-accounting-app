import ExcelJS from 'exceljs';
import { Expense, FuelSale, Shift } from '../types/petrolStation';

export async function exportExpensesToExcel(expenses: Expense[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Expenses');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  expenses.forEach(exp => {
    sheet.addRow({
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      notes: exp.notes || ''
    });
  });

  return workbook;
}

export async function exportFuelSalesToExcel(sales: FuelSale[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Fuel Sales');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Pump ID', key: 'pumpId', width: 10 },
    { header: 'Fuel Type', key: 'fuelType', width: 15 },
    { header: 'Liters', key: 'litersSold', width: 15 },
    { header: 'Price/Liter', key: 'pricePerLiter', width: 15 },
    { header: 'Total', key: 'totalAmount', width: 15 },
    { header: 'Payment', key: 'paymentMethod', width: 15 },
  ];

  sales.forEach(sale => {
    sheet.addRow({
      date: sale.date,
      pumpId: sale.pumpId,
      fuelType: sale.fuelType,
      litersSold: sale.litersSold,
      pricePerLiter: sale.pricePerLiter,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
    });
  });

  return workbook;
}

export async function exportShiftsToExcel(shifts: Shift[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Shifts');

  sheet.columns = [
    { header: 'Start Time', key: 'startTime', width: 20 },
    { header: 'End Time', key: 'endTime', width: 20 },
    { header: 'Total Cash', key: 'totalCash', width: 15 },
    { header: 'Total M-Pesa', key: 'totalMpesas', width: 15 },
    { header: 'Total Sales', key: 'totalSales', width: 15 },
  ];

  shifts.forEach(shift => {
    const totalSales = shift.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    sheet.addRow({
      startTime: shift.startTime,
      endTime: shift.endTime || 'Ongoing',
      totalCash: shift.totalCash,
      totalMpesas: shift.totalMpesas,
      totalSales,
    });
  });

  return workbook;
} 