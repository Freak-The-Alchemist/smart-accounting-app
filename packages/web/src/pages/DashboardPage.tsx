import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  TrendingUp as SalesIcon,
  AccountBalance as BalanceIcon,
  LocalGasStation as FuelIcon,
  Receipt as ExpenseIcon,
  MoreVert as MoreVertIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useDataSync } from '../hooks/useDataSync';
import { formatCurrency, formatVolume } from '../utils/formatters';

interface DashboardData {
  todaySales: number;
  fuelStock: number;
  expenses: number;
  balance: number;
  recentSales: Array<{
    id: string;
    date: string;
    amount: number;
    fuelType: string;
    volume: number;
  }>;
  stockLevels: Array<{
    id: string;
    fuelType: string;
    currentLevel: number;
    capacity: number;
  }>;
}

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: salesData, isLoading: salesLoading } = useDataSync({
    collection: 'sales',
    query: [
      {
        field: 'date',
        operator: '>=',
        value: getDateRange(timeRange),
      },
    ],
    orderBy: {
      field: 'date',
      direction: 'desc',
    },
  });

  const { data: stockData, isLoading: stockLoading } = useDataSync({
    collection: 'inventory',
    query: [
      {
        field: 'type',
        operator: '==',
        value: 'fuel',
      },
    ],
  });

  const summaryData = {
    todaySales: {
      value: formatCurrency(calculateTotalSales(salesData)),
      change: calculateChange(salesData, timeRange),
      icon: <SalesIcon />,
      title: 'Today\'s Sales',
    },
    fuelStock: {
      value: formatVolume(calculateTotalStock(stockData)),
      change: calculateStockChange(stockData),
      icon: <FuelIcon />,
      title: 'Fuel Stock',
    },
    expenses: {
      value: formatCurrency(calculateTotalExpenses(salesData)),
      change: calculateExpenseChange(salesData, timeRange),
      icon: <ExpenseIcon />,
      title: 'Today\'s Expenses',
    },
    balance: {
      value: formatCurrency(calculateBalance(salesData)),
      change: calculateBalanceChange(salesData, timeRange),
      icon: <BalanceIcon />,
      title: 'Net Balance',
    },
  };

  const handleTimeRangeClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTimeRangeClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeSelect = (range: 'day' | 'week' | 'month') => {
    setTimeRange(range);
    handleTimeRangeClose();
  };

  if (salesLoading || stockLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <IconButton onClick={handleTimeRangeClick}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleTimeRangeClose}
        >
          <MenuItem onClick={() => handleTimeRangeSelect('day')}>Today</MenuItem>
          <MenuItem onClick={() => handleTimeRangeSelect('week')}>This Week</MenuItem>
          <MenuItem onClick={() => handleTimeRangeSelect('month')}>This Month</MenuItem>
        </Menu>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(summaryData).map(([key, data]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography color="text.secondary" variant="subtitle2">
                    {data.title}
                  </Typography>
                  <Box
                    sx={{
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {data.icon}
                  </Box>
                </Box>
                <Typography variant="h4" component="div" gutterBottom>
                  {data.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {data.change.startsWith('+') ? (
                    <ArrowUpwardIcon color="success" fontSize="small" />
                  ) : (
                    <ArrowDownwardIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    color={data.change.startsWith('+') ? 'success.main' : 'error.main'}
                    sx={{ ml: 0.5 }}
                  >
                    {data.change} from {timeRange === 'day' ? 'yesterday' : `last ${timeRange}`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Sales
            </Typography>
            <List>
              {salesData?.slice(0, 5).map((sale) => (
                <React.Fragment key={sale.id}>
                  <ListItem>
                    <ListItemText
                      primary={sale.fuelType}
                      secondary={new Date(sale.date).toLocaleDateString()}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" color="text.secondary">
                        {formatVolume(sale.volume)}
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(sale.amount)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fuel Stock Levels
            </Typography>
            <List>
              {stockData?.map((stock) => (
                <React.Fragment key={stock.id}>
                  <ListItem>
                    <ListItemText
                      primary={stock.fuelType}
                      secondary={`${formatVolume(stock.currentLevel)} / ${formatVolume(stock.capacity)}`}
                    />
                    <ListItemSecondaryAction>
                      <Box
                        sx={{
                          width: 100,
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(stock.currentLevel / stock.capacity) * 100}%`,
                            height: '100%',
                            bgcolor: getStockLevelColor(stock.currentLevel / stock.capacity),
                          }}
                        />
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Helper functions
function getDateRange(range: 'day' | 'week' | 'month'): Date {
  const date = new Date();
  switch (range) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    default:
      date.setDate(date.getDate() - 1);
  }
  return date;
}

function calculateTotalSales(data: any[]): number {
  return data?.reduce((sum, sale) => sum + sale.amount, 0) || 0;
}

function calculateTotalStock(data: any[]): number {
  return data?.reduce((sum, stock) => sum + stock.currentLevel, 0) || 0;
}

function calculateTotalExpenses(data: any[]): number {
  return data?.reduce((sum, sale) => sum + (sale.expenses || 0), 0) || 0;
}

function calculateBalance(data: any[]): number {
  return calculateTotalSales(data) - calculateTotalExpenses(data);
}

function calculateChange(data: any[], range: 'day' | 'week' | 'month'): string {
  // Implement change calculation logic
  return '+12%';
}

function calculateStockChange(data: any[]): string {
  // Implement stock change calculation logic
  return '-5%';
}

function calculateExpenseChange(data: any[], range: 'day' | 'week' | 'month'): string {
  // Implement expense change calculation logic
  return '+8%';
}

function calculateBalanceChange(data: any[], range: 'day' | 'week' | 'month'): string {
  // Implement balance change calculation logic
  return '+15%';
}

function getStockLevelColor(level: number): string {
  if (level > 0.7) return '#4caf50';
  if (level > 0.3) return '#ff9800';
  return '#f44336';
} 