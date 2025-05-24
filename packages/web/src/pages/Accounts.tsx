import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Account } from '@smart-accounting/shared/types/accounting';
import { accountingService } from '@smart-accounting/shared/services/accountingService';
import { formatCurrency } from '../utils/formatters';
import { AccountBreakdown } from '../components/AccountBreakdown';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await accountingService.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdownClick = (account: Account) => {
    setSelectedAccount(account);
    setBreakdownOpen(true);
  };

  const handleCloseBreakdown = () => {
    setBreakdownOpen(false);
    setSelectedAccount(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Accounts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.code}</TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell>{formatCurrency(account.balance)}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleBreakdownClick(account)}
                  >
                    View Breakdown
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={breakdownOpen}
        onClose={handleCloseBreakdown}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAccount?.name} Account Breakdown
        </DialogTitle>
        <DialogContent>
          {selectedAccount && (
            <AccountBreakdown
              accountId={selectedAccount.id}
              startDate={new Date(new Date().getFullYear(), 0, 1)} // Start of current year
              endDate={new Date()} // Current date
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBreakdown}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 