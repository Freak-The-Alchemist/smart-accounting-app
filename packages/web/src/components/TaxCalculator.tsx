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
  MenuItem,
} from '@mui/material';
import { useAccounting } from '@smart-accounting/shared/hooks/useAccounting';
import { Account, AccountType } from '@smart-accounting/shared/models/AccountingEntry';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'income' | 'sales' | 'property';
  description?: string;
}

interface TaxCalculation {
  taxType: string;
  taxableAmount: number;
  taxAmount: number;
  rate: number;
}

export const TaxCalculator: React.FC = () => {
  const { getAccounts, getAccountBalance, loading, error } = useAccounting();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { id: '1', name: 'Income Tax', rate: 0.21, type: 'income' },
    { id: '2', name: 'Sales Tax', rate: 0.08, type: 'sales' },
    { id: '3', name: 'Property Tax', rate: 0.015, type: 'property' },
  ]);
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const fetchedAccounts = await getAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const calculateTaxes = async () => {
    const newCalculations: TaxCalculation[] = [];

    // Calculate Income Tax
    const incomeAccounts = accounts.filter(a => a.type === 'revenue');
    let totalIncome = 0;
    for (const account of incomeAccounts) {
      const balance = await getAccountBalance(account.id, selectedPeriod.start, selectedPeriod.end);
      totalIncome += balance.closingBalance;
    }

    const incomeTaxRate = taxRates.find(r => r.type === 'income');
    if (incomeTaxRate) {
      newCalculations.push({
        taxType: incomeTaxRate.name,
        taxableAmount: totalIncome,
        taxAmount: totalIncome * incomeTaxRate.rate,
        rate: incomeTaxRate.rate,
      });
    }

    // Calculate Sales Tax
    const salesAccounts = accounts.filter(a => a.category === 'operating_revenue');
    let totalSales = 0;
    for (const account of salesAccounts) {
      const balance = await getAccountBalance(account.id, selectedPeriod.start, selectedPeriod.end);
      totalSales += balance.closingBalance;
    }

    const salesTaxRate = taxRates.find(r => r.type === 'sales');
    if (salesTaxRate) {
      newCalculations.push({
        taxType: salesTaxRate.name,
        taxableAmount: totalSales,
        taxAmount: totalSales * salesTaxRate.rate,
        rate: salesTaxRate.rate,
      });
    }

    // Calculate Property Tax
    const propertyAccounts = accounts.filter(a => a.category === 'fixed_asset');
    let totalProperty = 0;
    for (const account of propertyAccounts) {
      const balance = await getAccountBalance(account.id, selectedPeriod.start, selectedPeriod.end);
      totalProperty += balance.closingBalance;
    }

    const propertyTaxRate = taxRates.find(r => r.type === 'property');
    if (propertyTaxRate) {
      newCalculations.push({
        taxType: propertyTaxRate.name,
        taxableAmount: totalProperty,
        taxAmount: totalProperty * propertyTaxRate.rate,
        rate: propertyTaxRate.rate,
      });
    }

    setCalculations(newCalculations);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tax Calculator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={calculateTaxes}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Calculating...' : 'Calculate Taxes'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {calculations.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tax Type</TableCell>
                <TableCell align="right">Taxable Amount</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Tax Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculations.map((calc, index) => (
                <TableRow key={index}>
                  <TableCell>{calc.taxType}</TableCell>
                  <TableCell align="right">{formatCurrency(calc.taxableAmount)}</TableCell>
                  <TableCell align="right">{formatPercentage(calc.rate)}</TableCell>
                  <TableCell align="right">{formatCurrency(calc.taxAmount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="subtitle1">Total Tax Liability</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1">
                    {formatCurrency(calculations.reduce((sum, calc) => sum + calc.taxAmount, 0))}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}; 