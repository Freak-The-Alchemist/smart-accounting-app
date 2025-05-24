import React from 'react';
import type { Shift, FuelSale, Expense } from '../types/petrolStation';

interface FinancialReportsProps {
  shifts: Shift[];
  sales: FuelSale[];
  expenses: Expense[];
  startDate: Date;
  endDate: Date;
}

export const calculateFinancialMetrics = (sales: FuelSale[], expenses: Expense[]) => {
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netIncome = totalSales - totalExpenses;

  // Calculate sales by fuel type
  const salesByFuelType = sales.reduce((acc, sale) => {
    acc[sale.fuelType] = (acc[sale.fuelType] || 0) + sale.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate sales by payment method
  const salesByPaymentMethod = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate daily totals
  const dailyTotals = sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + sale.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSales,
    totalExpenses,
    netIncome,
    salesByFuelType,
    salesByPaymentMethod,
    expensesByCategory,
    dailyTotals
  };
};

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  shifts,
  sales,
  expenses,
  startDate,
  endDate
}) => {
  const metrics = calculateFinancialMetrics(sales, expenses);

  return {
    metrics,
    startDate,
    endDate
  };
}; 