import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { advancedAccountingService } from '@smart-accounting/shared/services/advancedAccountingService';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-analysis-tabpanel-${index}`}
      aria-labelledby={`financial-analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const FinancialAnalysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [bankStatement, setBankStatement] = useState<{ date: Date; amount: number; reference: string }[]>([]);
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);

  useEffect(() => {
    loadFinancialRatios();
  }, [startDate, endDate]);

  const loadFinancialRatios = async () => {
    try {
      setLoading(true);
      const ratios = await advancedAccountingService.calculateFinancialRatios(startDate, endDate);
      setFinancialRatios(ratios);
    } catch (err) {
      setError('Failed to load financial ratios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconciliation = async () => {
    try {
      setLoading(true);
      const result = await advancedAccountingService.reconcileAccount(
        selectedAccount,
        startDate,
        endDate,
        bankStatement
      );
      setReconciliationResult(result);
    } catch (err) {
      setError('Failed to reconcile account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderFinancialRatios = () => {
    if (!financialRatios) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Liquidity Ratios
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Current Ratio</TableCell>
                    <TableCell align="right">{financialRatios.liquidity.currentRatio.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Quick Ratio</TableCell>
                    <TableCell align="right">{financialRatios.liquidity.quickRatio.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cash Ratio</TableCell>
                    <TableCell align="right">{financialRatios.liquidity.cashRatio.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Profitability Ratios
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Gross Profit Margin</TableCell>
                    <TableCell align="right">{formatPercentage(financialRatios.profitability.grossProfitMargin)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Operating Profit Margin</TableCell>
                    <TableCell align="right">{formatPercentage(financialRatios.profitability.operatingProfitMargin)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Net Profit Margin</TableCell>
                    <TableCell align="right">{formatPercentage(financialRatios.profitability.netProfitMargin)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Return on Assets</TableCell>
                    <TableCell align="right">{formatPercentage(financialRatios.profitability.returnOnAssets)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Return on Equity</TableCell>
                    <TableCell align="right">{formatPercentage(financialRatios.profitability.returnOnEquity)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Efficiency Ratios
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Asset Turnover</TableCell>
                    <TableCell align="right">{financialRatios.efficiency.assetTurnover.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Inventory Turnover</TableCell>
                    <TableCell align="right">{financialRatios.efficiency.inventoryTurnover.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Receivables Turnover</TableCell>
                    <TableCell align="right">{financialRatios.efficiency.receivablesTurnover.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Leverage Ratios
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Debt to Equity</TableCell>
                    <TableCell align="right">{financialRatios.leverage.debtToEquity.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Debt to Assets</TableCell>
                    <TableCell align="right">{financialRatios.leverage.debtToAssets.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Interest Coverage</TableCell>
                    <TableCell align="right">{financialRatios.leverage.interestCoverage.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderReconciliationDialog = () => {
    return (
      <Dialog open={reconciliationDialogOpen} onClose={() => setReconciliationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bank Reconciliation</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="subtitle1" gutterBottom>
              Bank Statement Entries
            </Typography>
            {bankStatement.map((entry, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <DatePicker
                      label="Date"
                      value={entry.date}
                      onChange={(date) => {
                        const newStatement = [...bankStatement];
                        newStatement[index].date = date || new Date();
                        setBankStatement(newStatement);
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={entry.amount}
                      onChange={(e) => {
                        const newStatement = [...bankStatement];
                        newStatement[index].amount = parseFloat(e.target.value);
                        setBankStatement(newStatement);
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Reference"
                      value={entry.reference}
                      onChange={(e) => {
                        const newStatement = [...bankStatement];
                        newStatement[index].reference = e.target.value;
                        setBankStatement(newStatement);
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() => setBankStatement([...bankStatement, { date: new Date(), amount: 0, reference: '' }])}
              sx={{ mt: 2 }}
            >
              Add Entry
            </Button>
          </Box>
          {reconciliationResult && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Reconciliation Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reconciliationResult.differences.map((diff: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(diff.date).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(diff.amount)}</TableCell>
                        <TableCell>{diff.reference}</TableCell>
                        <TableCell>{diff.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Summary</Typography>
                <Typography>Book Balance: {formatCurrency(reconciliationResult.summary.bookBalance)}</Typography>
                <Typography>Bank Balance: {formatCurrency(reconciliationResult.summary.bankBalance)}</Typography>
                <Typography>Difference: {formatCurrency(reconciliationResult.summary.difference)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReconciliationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReconciliation} variant="contained">
            Reconcile
          </Button>
        </DialogActions>
      </Dialog>
    );
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Financial Ratios" />
          <Tab label="Bank Reconciliation" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => date && setStartDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => date && setEndDate(date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>
        {renderFinancialRatios()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Button variant="contained" onClick={() => setReconciliationDialogOpen(true)}>
          Start Reconciliation
        </Button>
      </TabPanel>

      {renderReconciliationDialog()}
    </Box>
  );
}; 