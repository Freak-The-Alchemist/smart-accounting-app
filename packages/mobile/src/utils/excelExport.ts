import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportToExcel } from '@smart-accounting/shared/utils/excelExport';
import { FuelSale, Shift, Expense } from '@smart-accounting/shared/types/petrolStation';

interface MobileExportOptions {
  filename: string;
  sheetName: string;
  dateFormat?: string;
  currency?: string;
}

export async function exportToExcelMobile<T extends FuelSale | Shift | Expense>(
  data: T[],
  options: Partial<MobileExportOptions> = {}
): Promise<void> {
  try {
    // Generate Excel file
    const buffer = await exportToExcel(data, options);
    
    // Save to local file system
    const filename = `${options.filename || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, buffer.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Report',
        UTI: 'com.microsoft.excel.xlsx'
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export report. Please try again.');
  }
}

// Convenience functions for specific data types
export async function exportFuelSales(sales: FuelSale[]): Promise<void> {
  return exportToExcelMobile(sales, {
    filename: 'Fuel_Sales',
    sheetName: 'Fuel Sales'
  });
}

export async function exportShifts(shifts: Shift[]): Promise<void> {
  return exportToExcelMobile(shifts, {
    filename: 'Shift_Logs',
    sheetName: 'Shift Logs'
  });
}

export async function exportExpenses(expenses: Expense[]): Promise<void> {
  return exportToExcelMobile(expenses, {
    filename: 'Expenses',
    sheetName: 'Expenses'
  });
} 