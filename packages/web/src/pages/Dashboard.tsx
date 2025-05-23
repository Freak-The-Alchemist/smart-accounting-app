import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  getFuelSales,
  getExpenses,
  getLowStockItems,
} from '@smart-accounting/shared/services/firebase';
import { FuelSale, Expense, StockItem } from '@smart-accounting/shared/types/petrolStation';
import { getAllFuelSales } from '../../../shared/src/services/fuelSaleService';
import { getAllShifts } from '../../../shared/src/services/shiftService';
import { getAllExpenses } from '../../../shared/src/services/expenseService';
import { getAllStockItems } from '../../../shared/src/services/stockItemService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    todayExpenses: 0,
    activeShift: null as Shift | null,
    lowStockItems: [] as StockItem[],
    recentSales: [] as FuelSale[],
    recentExpenses: [] as Expense[],
  });

  useEffect(() => {
    if (user?.stationId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.stationId) return;

    try {
      setLoading(true);
      const [fuelSales, shifts, expenses, stockItems] = await Promise.all([
        getAllFuelSales(),
        getAllShifts(),
        getAllExpenses(),
        getAllStockItems(),
      ]);

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate today's metrics
      const todaySales = fuelSales
        .filter(sale => new Date(sale.timestamp) >= today)
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      const todayExpenses = expenses
        .filter(expense => new Date(expense.timestamp) >= today)
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Find active shift
      const activeShift = shifts.find(shift => !shift.endTime);

      // Find low stock items
      const lowStockItems = stockItems.filter(
        item => item.quantity <= item.reorderPoint
      );

      // Get recent sales and expenses
      const recentSales = fuelSales
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      const recentExpenses = expenses
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setMetrics({
        todaySales,
        todayExpenses,
        activeShift,
        lowStockItems,
        recentSales,
        recentExpenses,
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSales = () => {
    return metrics.recentSales.reduce((total, sale) => total + sale.totalAmount, 0);
  };

  const calculateTotalExpenses = () => {
    return metrics.recentExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getSalesByFuelType = () => {
    const salesByType = metrics.recentSales.reduce((acc, sale) => {
      acc[sale.fuelType] = (acc[sale.fuelType] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByType).map(([type, amount]) => ({
      type,
      amount,
    }));
  };

  const getSalesByHour = () => {
    const salesByHour = metrics.recentSales.reduce((acc, sale) => {
      const hour = new Date(sale.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<number, number>);

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      amount: salesByHour[i] || 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
          <p className="text-2xl font-semibold text-gray-900">${metrics.todaySales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Today's Expenses</h3>
          <p className="text-2xl font-semibold text-gray-900">${metrics.todayExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
          <p className="text-2xl font-semibold text-gray-900">
            ${(metrics.todaySales - metrics.todayExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Active Shift and Low Stock Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Active Shift */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Active Shift</h3>
          {metrics.activeShift ? (
            <div>
              <p className="text-sm text-gray-500">
                Started: {new Date(metrics.activeShift.startTime).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Opening Cash: ${metrics.activeShift.openingCash.toFixed(2)}
              </p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                End Shift
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">No active shift</p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Start New Shift
              </button>
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Low Stock Alerts</h3>
          {metrics.lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {metrics.lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-red-600">
                    {item.quantity} {item.unit} remaining
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No low stock items</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Recent Sales</h3>
          <div className="space-y-4">
            {metrics.recentSales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sale.fuelType}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">${sale.totalAmount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Recent Expenses</h3>
          <div className="space-y-4">
            {metrics.recentExpenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{expense.category}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">${expense.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 