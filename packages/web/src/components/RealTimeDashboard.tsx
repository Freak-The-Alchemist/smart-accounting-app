import React, { useEffect, useState } from 'react';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { formatCurrency } from '@smart-accounting/shared/utils/format';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { useUserRole } from '@smart-accounting/shared/hooks/useUserRole';

interface DashboardStats {
  totalExpenses: number;
  totalFuelSales: number;
  totalShifts: number;
  averageSaleAmount: number;
  recentSales: any[];
  recentExpenses: any[];
}

export default function RealTimeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalFuelSales: 0,
    totalShifts: 0,
    averageSaleAmount: 0,
    recentSales: [],
    recentExpenses: []
  });
  const { role } = useUserRole();

  useEffect(() => {
    // Set up real-time listeners for all collections
    const unsubExpenses = onSnapshot(
      query(collection(db, 'expenses'), orderBy('date', 'desc')),
      (snap) => {
        const expenses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStats(prev => ({
          ...prev,
          totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
          recentExpenses: expenses.slice(0, 5)
        }));
      }
    );

    const unsubSales = onSnapshot(
      query(collection(db, 'fuelSales'), orderBy('date', 'desc')),
      (snap) => {
        const sales = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        setStats(prev => ({
          ...prev,
          totalFuelSales: total,
          averageSaleAmount: sales.length ? total / sales.length : 0,
          recentSales: sales.slice(0, 5)
        }));
      }
    );

    const unsubShifts = onSnapshot(
      query(collection(db, 'shifts'), where('status', '==', 'active')),
      (snap) => {
        setStats(prev => ({
          ...prev,
          totalShifts: snap.size
        }));
      }
    );

    return () => {
      unsubExpenses();
      unsubSales();
      unsubShifts();
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Real-Time Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Fuel Sales
              </Typography>
              <Typography variant="h5">
                {formatCurrency(stats.totalFuelSales)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h5">
                {formatCurrency(stats.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Shifts
              </Typography>
              <Typography variant="h5">
                {stats.totalShifts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Sale
              </Typography>
              <Typography variant="h5">
                {formatCurrency(stats.averageSaleAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {role === 'manager' && (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Sales
                  </Typography>
                  {stats.recentSales.map(sale => (
                    <Box key={sale.id} sx={{ mb: 1 }}>
                      <Typography>
                        {sale.fuelType}: {sale.litersSold}L - {formatCurrency(sale.totalAmount)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Expenses
                  </Typography>
                  {stats.recentExpenses.map(expense => (
                    <Box key={expense.id} sx={{ mb: 1 }}>
                      <Typography>
                        {expense.description}: {formatCurrency(expense.amount)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
} 