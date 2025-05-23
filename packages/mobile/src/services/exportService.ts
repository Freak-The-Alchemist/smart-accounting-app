import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { exportToExcel, generateFuelSalesReport, generateShiftReport, generateDailyReport } from '@smart-accounting/shared/utils/excel';
import { FuelSale, Shift, Expense, DailyReport } from '@smart-accounting/shared/types';

export async function exportFuelSales(startDate: Date, endDate: Date) {
  try {
    const salesQuery = query(
      collection(db, 'fuelSales'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));

    const report = generateFuelSalesReport(sales);
    const fileUri = `${FileSystem.documentDirectory}${report.filename}.xlsx`;
    
    await exportToExcel({
      ...report,
      filename: fileUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } catch (error) {
    console.error('Error exporting fuel sales:', error);
    throw error;
  }
}

export async function exportShiftReport(shiftId: string) {
  try {
    // Get shift data
    const shiftDoc = await getDocs(query(collection(db, 'shifts'), where('id', '==', shiftId)));
    if (shiftDoc.empty) throw new Error('Shift not found');
    const shift = { id: shiftDoc.docs[0].id, ...shiftDoc.docs[0].data() } as Shift;

    // Get sales for this shift
    const salesQuery = query(
      collection(db, 'fuelSales'),
      where('shiftId', '==', shiftId)
    );
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));

    // Get expenses for this shift
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('shiftId', '==', shiftId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

    const report = generateShiftReport(shift, sales, expenses);
    const fileUri = `${FileSystem.documentDirectory}${report.filename}.xlsx`;

    // Export each sheet
    for (const sheet of report.sheets) {
      await exportToExcel({
        filename: fileUri,
        sheetName: sheet.name,
        data: sheet.data,
        columns: sheet.columns,
      });
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } catch (error) {
    console.error('Error exporting shift report:', error);
    throw error;
  }
}

export async function exportDailyReport(date: Date) {
  try {
    // Get all sales for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const salesQuery = query(
      collection(db, 'fuelSales'),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));

    // Get all expenses for the day
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group sales by fuel type
    const fuelSales = sales.reduce((acc, sale) => {
      acc[sale.fuelType] = (acc[sale.fuelType] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Group sales by payment method
    const paymentMethods = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Group expenses by category
    const expensesByCategory = expenses.map(expense => ({
      category: expense.category,
      amount: expense.amount,
    }));

    const report: DailyReport = {
      date,
      totalSales,
      totalExpenses,
      fuelSales,
      paymentMethods,
      expenses: expensesByCategory,
    };

    const reportData = generateDailyReport(report);
    const fileUri = `${FileSystem.documentDirectory}${reportData.filename}.xlsx`;

    // Export each sheet
    for (const sheet of reportData.sheets) {
      await exportToExcel({
        filename: fileUri,
        sheetName: sheet.name,
        data: sheet.data,
        columns: sheet.columns,
      });
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } catch (error) {
    console.error('Error exporting daily report:', error);
    throw error;
  }
} 