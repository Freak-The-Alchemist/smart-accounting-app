import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAccounting } from '@smart-accounting/shared/hooks/useAccounting';
import { Account, JournalEntry } from '@smart-accounting/shared/models/AccountingEntry';

interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'unreconciled' | 'reconciled';
  journalEntryId?: string;
}

interface ReconciliationSummary {
  bankBalance: number;
  bookBalance: number;
  difference: number;
  reconciledItems: number;
  totalItems: number;
}

export const BankReconciliation: React.FC = () => {
  const { getAccounts, getAccountBalance, getJournalEntries, loading, error } = useAccounting();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    bankBalance: 0,
    bookBalance: 0,
    difference: 0,
    reconciledItems: 0,
    totalItems: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions();
    }
  }, [selectedAccount, selectedPeriod]);

  const loadAccounts = async () => {
    try {
      const fetchedAccounts = await getAccounts();
      const bankAccounts = fetchedAccounts.filter(a => a.category === 'current_asset');
      setAccounts(bankAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      // Load bank transactions (this would typically come from a bank API)
      const mockTransactions: BankTransaction[] = [
        {
          id: '1',
          date: new Date(),
          description: 'Deposit',
          amount: 1000,
          type: 'deposit',
          status: 'unreconciled',
        },
        {
          id: '2',
          date: new Date(),
          description: 'Withdrawal',
          amount: 500,
          type: 'withdrawal',
          status: 'unreconciled',
        },
      ];
      setBankTransactions(mockTransactions);

      // Load journal entries
      const entries = await getJournalEntries();
      setJournalEntries(entries);

      // Calculate summary
      const bankBalance = mockTransactions.reduce((sum, t) => {
        return sum + (t.type === 'deposit' ? t.amount : -t.amount);
      }, 0);

      const accountBalance = await getAccountBalance(selectedAccount, selectedPeriod.start, selectedPeriod.end);
      const bookBalance = accountBalance.closingBalance;

      setSummary({
        bankBalance,
        bookBalance,
        difference: bankBalance - bookBalance,
        reconciledItems: mockTransactions.filter(t => t.status === 'reconciled').length,
        totalItems: mockTransactions.length,
      });
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleReconcile = (transactionId: string, journalEntryId: string) => {
    setBankTransactions(transactions =>
      transactions.map(t =>
        t.id === transactionId
          ? { ...t, status: 'reconciled', journalEntryId }
          : t
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Bank Reconciliation
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Bank Account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              fullWidth
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="Start Date"
              value={selectedPeriod.start.toISOString().split('T')[0]}
              onChange={(e) => setSelectedPeriod({
                ...selectedPeriod,
                start: new Date(e.target.value),
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              type="date"
              label="End Date"
              value={selectedPeriod.end.toISOString().split('T')[0]}
              onChange={(e) => setSelectedPeriod({
                ...selectedPeriod,
                end: new Date(e.target.value),
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {selectedAccount && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Bank Balance</Typography>
                <Typography variant="h6">{formatCurrency(summary.bankBalance)}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Book Balance</Typography>
                <Typography variant="h6">{formatCurrency(summary.bookBalance)}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Difference</Typography>
                <Typography
                  variant="h6"
                  color={summary.difference === 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(summary.difference)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Reconciled Items</Typography>
                <Typography variant="h6">
                  {summary.reconciledItems} / {summary.totalItems}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.status}</TableCell>
                    <TableCell>
                      {transaction.status === 'unreconciled' && (
                        <Tooltip title="Reconcile">
                          <IconButton
                            size="small"
                            onClick={() => handleReconcile(transaction.id, '')}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}; 