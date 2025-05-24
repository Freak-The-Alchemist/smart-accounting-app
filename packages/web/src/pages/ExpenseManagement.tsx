import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createExpense,
  getExpenses,
  getActiveShift,
} from '@smart-accounting/shared/services/firebase';
import { Expense, ExpenseCategory } from '@smart-accounting/shared/types/petrolStation';

export default function ExpenseManagement() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpenseDialog, setNewExpenseDialog] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: ExpenseCategory.OTHER,
  });

  useEffect(() => {
    loadActiveShift();
  }, [user]);

  useEffect(() => {
    if (activeShift) {
      loadExpenses();
    }
  }, [activeShift]);

  const loadActiveShift = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const shift = await getActiveShift(user.id);
      setActiveShift(shift?.id || null);
    } catch (err) {
      setError('Failed to load active shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!activeShift) return;

    try {
      setLoading(true);
      const expensesList = await getExpenses(activeShift);
      setExpenses(expensesList);
    } catch (err) {
      setError('Failed to load expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!activeShift || !newExpense.amount || !newExpense.description) return;

    try {
      setLoading(true);
      const expense: Omit<Expense, 'id'> = {
        shiftId: activeShift,
        amount: newExpense.amount,
        category: newExpense.category as ExpenseCategory,
        description: newExpense.description,
        timestamp: new Date(),
        attendantId: user!.id,
      };

      await createExpense(expense);
      setNewExpenseDialog(false);
      setNewExpense({});
      await loadExpenses();
    } catch (err) {
      setError('Failed to add expense');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Expense Management
          </Typography>

          {!activeShift ? (
            <Alert severity="info">
              No active shift found. Please start a shift to manage expenses.
            </Alert>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setNewExpenseDialog(true)}
              sx={{ mt: 2 }}
            >
              Add Expense
            </Button>
          )}
        </CardContent>
      </Card>

      {activeShift && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today's Expenses
            </Typography>
            <Grid container spacing={2}>
              {expenses.map((expense) => (
                <Grid item xs={12} sm={6} md={4} key={expense.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {expense.category}
                      </Typography>
                      <Typography>
                        Amount: ${expense.amount.toFixed(2)}
                      </Typography>
                      <Typography>
                        Description: {expense.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {expense.timestamp.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog open={newExpenseDialog} onClose={() => setNewExpenseDialog(false)}>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              fullWidth
              label="Category"
              value={newExpense.category}
              onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  category: e.target.value as ExpenseCategory,
                })
              }
              sx={{ mb: 2 }}
            >
              {Object.values(ExpenseCategory).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newExpense.amount || ''}
              onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  amount: parseFloat(e.target.value),
                })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newExpense.description || ''}
              onChange={(e) =>
                setNewExpense({
                  ...newExpense,
                  description: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewExpenseDialog(false)}>Cancel</Button>
          <Button onClick={addExpense} variant="contained" color="primary">
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 