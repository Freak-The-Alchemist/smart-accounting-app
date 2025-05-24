import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AccountingEntry } from '@smart-accounting/shared/types/accounting';
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
} from '@smart-accounting/shared/services/financialReporting';
import { formatCurrency } from '@smart-accounting/shared/services/inputProcessing';

type ReportType = 'balance_sheet' | 'income_statement' | 'cash_flow';

export function FinancialReportsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('balance_sheet');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const entriesRef = collection(db, 'accounting_entries');
    const q = query(
      entriesRef,
      where('createdBy', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AccountingEntry[];
        setEntries(newEntries);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const generateReport = async () => {
      if (entries.length === 0) return;

      try {
        let newReport;
        switch (reportType) {
          case 'balance_sheet':
            newReport = await generateBalanceSheet(entries, startDate, endDate);
            break;
          case 'income_statement':
            newReport = await generateIncomeStatement(entries, startDate, endDate);
            break;
          case 'cash_flow':
            newReport = await generateCashFlowStatement(entries, startDate, endDate);
            break;
        }
        setReport(newReport);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    generateReport();
  }, [entries, reportType, startDate, endDate]);

  const renderBalanceSheet = () => {
    if (!report) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Assets</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Current Assets</TableCell>
              <TableCell align="right">
                {formatCurrency(
                  Object.values(report.assets.current).reduce((a: number, b: number) => a + b, 0)
                )}
              </TableCell>
            </TableRow>
            {Object.entries(report.assets.current).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Fixed Assets</TableCell>
              <TableCell align="right">
                {formatCurrency(
                  Object.values(report.assets.fixed).reduce((a: number, b: number) => a + b, 0)
                )}
              </TableCell>
            </TableRow>
            {Object.entries(report.assets.fixed).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Liabilities</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Current Liabilities</TableCell>
              <TableCell align="right">
                {formatCurrency(
                  Object.values(report.liabilities.current).reduce((a: number, b: number) => a + b, 0)
                )}
              </TableCell>
            </TableRow>
            {Object.entries(report.liabilities.current).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Long-term Liabilities</TableCell>
              <TableCell align="right">
                {formatCurrency(
                  Object.values(report.liabilities.longTerm).reduce((a: number, b: number) => a + b, 0)
                )}
              </TableCell>
            </TableRow>
            {Object.entries(report.liabilities.longTerm).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Equity</TableCell>
            </TableRow>
            {Object.entries(report.equity).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderIncomeStatement = () => {
    if (!report) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
            </TableRow>
            {Object.entries(report.revenue).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Cost of Goods Sold</TableCell>
              <TableCell align="right">{formatCurrency(report.costOfGoodsSold)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Gross Profit</TableCell>
              <TableCell align="right">{formatCurrency(report.grossProfit)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Operating Expenses</TableCell>
            </TableRow>
            {Object.entries(report.operatingExpenses).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Operating Income</TableCell>
              <TableCell align="right">{formatCurrency(report.operatingIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Other Income</TableCell>
              <TableCell align="right">{formatCurrency(report.otherIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Other Expenses</TableCell>
              <TableCell align="right">{formatCurrency(report.otherExpenses)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Net Income</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(report.netIncome)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderCashFlowStatement = () => {
    if (!report) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Operating Activities</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Net Income</TableCell>
              <TableCell align="right">{formatCurrency(report.operating.netIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Adjustments</TableCell>
            </TableRow>
            {Object.entries(report.operating.adjustments).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Net Cash from Operations</TableCell>
              <TableCell align="right">{formatCurrency(report.operating.netCashFromOperations)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Investing Activities</TableCell>
            </TableRow>
            {Object.entries(report.investing).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Financing Activities</TableCell>
            </TableRow>
            {Object.entries(report.financing).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ pl: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell align="right">{formatCurrency(value as number)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Net Change in Cash</TableCell>
              <TableCell align="right">{formatCurrency(report.netChangeInCash)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Beginning Cash</TableCell>
              <TableCell align="right">{formatCurrency(report.beginningCash)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Ending Cash</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(report.endingCash)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Financial Reports</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                  >
                    <MenuItem value="balance_sheet">Balance Sheet</MenuItem>
                    <MenuItem value="income_statement">Income Statement</MenuItem>
                    <MenuItem value="cash_flow">Cash Flow Statement</MenuItem>
                  </Select>
                </FormControl>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => newValue && setStartDate(newValue)}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => newValue && setEndDate(newValue)}
                  />
                </LocalizationProvider>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    // TODO: Implement export functionality
                  }}
                >
                  Export
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {reportType === 'balance_sheet' && renderBalanceSheet()}
                {reportType === 'income_statement' && renderIncomeStatement()}
                {reportType === 'cash_flow' && renderCashFlowStatement()}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 