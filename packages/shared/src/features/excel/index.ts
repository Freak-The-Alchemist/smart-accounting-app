
import * as XLSX from 'xlsx';
import { Transaction } from '../../types';

export const exportToExcel = (transactions: Transaction[]): void => {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map(({ id, amount, description, date, category, type }) => ({
      Date: date.toLocaleDateString(),
      Description: description,
      Category: category,
      Type: type,
      Amount: amount,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  XLSX.writeFile(workbook, 'transactions.xlsx');
};

export const generateReport = (transactions: Transaction[]): void => {
  const summary = transactions.reduce(
    (acc, transaction) => {
      const type = transaction.type;
      acc[type] += transaction.amount;
      return acc;
    },
    { income: 0, expense: 0 } as Record<string, number>
  );

  const worksheet = XLSX.utils.json_to_sheet([
    { Category: 'Income', Amount: summary.income },
    { Category: 'Expense', Amount: summary.expense },
    { Category: 'Net', Amount: summary.income - summary.expense },
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

  XLSX.writeFile(workbook, 'summary.xlsx');
}; 