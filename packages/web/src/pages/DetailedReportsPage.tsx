import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import {
  getShiftsByDateRange,
  getFuelSalesByDateRange,
  getExpensesByDateRange,
  exportToExcel
} from '@smart-accounting/shared/services/firebase';
import { FinancialReports, calculateFinancialMetrics } from '@smart-accounting/shared/components/FinancialReports';
import type { Shift, FuelSale, Expense } from '@smart-accounting/shared/types/petrolStation';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const DetailedReportsPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate]);

  const loadData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const [shiftsData, salesData, expensesData] = await Promise.all([
        getShiftsByDateRange(startDate, endDate),
        getFuelSalesByDateRange(startDate, endDate),
        getExpensesByDateRange(startDate, endDate)
      ]);
      setShifts(shiftsData);
      setSales(salesData);
      setExpenses(expensesData);
    } catch (error) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) return;
    try {
      await exportToExcel({
        startDate,
        endDate,
        shifts,
        sales,
        expenses
      });
    } catch (error) {
      setError('Failed to export data. Please try again.');
    }
  };

  const metrics = calculateFinancialMetrics(sales, expenses);

  const renderSalesTrend = () => {
    const data = Object.entries(metrics.dailyTotals).map(([date, amount]) => ({
      date,
      amount
    }));

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sales Trend
          </Typography>
          <LineChart width={800} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </CardContent>
      </Card>
    );
  };

  const renderSalesByFuelType = () => {
    const data = Object.entries(metrics.salesByFuelType).map(([type, amount]) => ({
      name: type,
      value: amount
    }));

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sales by Fuel Type
          </Typography>
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentMethods = () => {
    const data = Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => ({
      name: method,
      value: amount
    }));

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sales by Payment Method
          </Typography>
          <BarChart width={600} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </CardContent>
      </Card>
    );
  };

  const renderExpensesBreakdown = () => {
    const data = Object.entries(metrics.expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expenses by Category
          </Typography>
          <PieChart width={400} height={300}>
            <Pie
              data={data}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Detailed Financial Reports
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  fullWidth
                >
                  Export to Excel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Sales Analysis" />
          <Tab label="Expenses Analysis" />
          <Tab label="Trends" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {renderSalesTrend()}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderSalesByFuelType()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderPaymentMethods()}
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {renderExpensesBreakdown()}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {renderSalesTrend()}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}; 