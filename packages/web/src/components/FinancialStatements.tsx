import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Typography, 
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { financialStatementService } from '@smart-accounting/shared/services/financialStatementService';
import { BalanceSheet, IncomeStatement, CashFlowStatement } from '@smart-accounting/shared/types/accounting';
import { formatCurrency } from '../utils/formatters';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { calculateFinancialRatios, getRatioAnalysis } from '../utils/financialAnalysis';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAccounting } from '@smart-accounting/shared/hooks/useAccounting';
import { Account, AccountType } from '@smart-accounting/shared/models/AccountingEntry';

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
      id={`financial-statement-tabpanel-${index}`}
      aria-labelledby={`financial-statement-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

type StatementType = 'balance_sheet' | 'income_statement' | 'cash_flow';

interface StatementSection {
  title: string;
  accounts: Account[];
  total: number;
}

export const FinancialStatements: React.FC = () => {
  const { getAccounts, getAccountBalance, loading, error } = useAccounting();
  const [selectedTab, setSelectedTab] = useState(0);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [statementType, setStatementType] = useState<StatementType>('balance_sheet');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sections, setSections] = useState<StatementSection[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlowStatement, setCashFlowStatement] = useState<CashFlowStatement | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [financialRatios, setFinancialRatios] = useState<any>(null);
  const [ratioAnalysis, setRatioAnalysis] = useState<any>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const loadAccounts = async () => {
    try {
      const fetchedAccounts = await getAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const generateBalanceSheet = async () => {
    const sections: StatementSection[] = [
      {
        title: 'Assets',
        accounts: accounts.filter(a => a.type === 'asset'),
        total: 0,
      },
      {
        title: 'Liabilities',
        accounts: accounts.filter(a => a.type === 'liability'),
        total: 0,
      },
      {
        title: 'Equity',
        accounts: accounts.filter(a => a.type === 'equity'),
        total: 0,
      },
    ];

    for (const section of sections) {
      let total = 0;
      for (const account of section.accounts) {
        const balance = await getAccountBalance(account.id, startDate, endDate);
        total += balance.closingBalance;
      }
      section.total = total;
    }

    setSections(sections);
  };

  const generateIncomeStatement = async () => {
    const sections: StatementSection[] = [
      {
        title: 'Revenue',
        accounts: accounts.filter(a => a.type === 'revenue'),
        total: 0,
      },
      {
        title: 'Expenses',
        accounts: accounts.filter(a => a.type === 'expense'),
        total: 0,
      },
    ];

    for (const section of sections) {
      let total = 0;
      for (const account of section.accounts) {
        const balance = await getAccountBalance(account.id, startDate, endDate);
        total += balance.closingBalance;
      }
      section.total = total;
    }

    setSections(sections);
  };

  const handleGenerate = async () => {
    await loadAccounts();
    if (statementType === 'balance_sheet') {
      await generateBalanceSheet();
    } else if (statementType === 'income_statement') {
      await generateIncomeStatement();
    }
  };

  const handleExportExcel = () => {
    if (!startDate || !endDate) {
      console.error('Please select both start and end dates');
      return;
    }

    try {
      switch (statementType) {
        case 'balance_sheet':
          if (balanceSheet) {
            exportToExcel(balanceSheet, 'balance_sheet', startDate, endDate);
          }
          break;
        case 'income_statement':
          if (incomeStatement) {
            exportToExcel(incomeStatement, 'income_statement', startDate, endDate);
          }
          break;
        case 'cash_flow':
          if (cashFlowStatement) {
            exportToExcel(cashFlowStatement, 'cash_flow', startDate, endDate);
          }
          break;
      }
    } catch (err) {
      console.error('Failed to export to Excel');
    }
  };

  const handleExportPDF = () => {
    if (!startDate || !endDate) {
      console.error('Please select both start and end dates');
      return;
    }

    try {
      switch (statementType) {
        case 'balance_sheet':
          if (balanceSheet) {
            exportToPDF(balanceSheet, 'balance_sheet', startDate, endDate);
          }
          break;
        case 'income_statement':
          if (incomeStatement) {
            exportToPDF(incomeStatement, 'income_statement', startDate, endDate);
          }
          break;
        case 'cash_flow':
          if (cashFlowStatement) {
            exportToPDF(cashFlowStatement, 'cash_flow', startDate, endDate);
          }
          break;
      }
    } catch (err) {
      console.error('Failed to export to PDF');
    }
  };

  const handleShowAnalysis = async () => {
    if (!balanceSheet || !incomeStatement || !cashFlowStatement) {
      console.error('Please generate all financial statements first');
      return;
    }

    try {
      const ratios = calculateFinancialRatios(balanceSheet, incomeStatement, cashFlowStatement);
      const analysis = getRatioAnalysis(ratios);
      setFinancialRatios(ratios);
      setRatioAnalysis(analysis);
      setShowAnalysis(true);
    } catch (err) {
      console.error('Failed to calculate financial ratios');
    }
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">Assets</Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle1">Current Assets</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Cash: {formatCurrency(balanceSheet.assets.current.cash)}</Typography>
                <Typography>Accounts Receivable: {formatCurrency(balanceSheet.assets.current.accountsReceivable)}</Typography>
                <Typography>Inventory: {formatCurrency(balanceSheet.assets.current.inventory)}</Typography>
                <Typography>Prepaid Expenses: {formatCurrency(balanceSheet.assets.current.prepaidExpenses)}</Typography>
                <Typography>Other Current Assets: {formatCurrency(balanceSheet.assets.current.otherCurrentAssets)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Fixed Assets</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Property: {formatCurrency(balanceSheet.assets.fixed.property)}</Typography>
                <Typography>Equipment: {formatCurrency(balanceSheet.assets.fixed.equipment)}</Typography>
                <Typography>Vehicles: {formatCurrency(balanceSheet.assets.fixed.vehicles)}</Typography>
                <Typography>Other Fixed Assets: {formatCurrency(balanceSheet.assets.fixed.otherFixedAssets)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Other Assets</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Investments: {formatCurrency(balanceSheet.assets.other.investments)}</Typography>
                <Typography>Intangible Assets: {formatCurrency(balanceSheet.assets.other.intangibleAssets)}</Typography>
                <Typography>Other Assets: {formatCurrency(balanceSheet.assets.other.otherAssets)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Liabilities</Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            <Typography variant="subtitle1">Current Liabilities</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Accounts Payable: {formatCurrency(balanceSheet.liabilities.current.accountsPayable)}</Typography>
                <Typography>Short-term Loans: {formatCurrency(balanceSheet.liabilities.current.shortTermLoans)}</Typography>
                <Typography>Accrued Expenses: {formatCurrency(balanceSheet.liabilities.current.accruedExpenses)}</Typography>
                <Typography>Other Current Liabilities: {formatCurrency(balanceSheet.liabilities.current.otherCurrentLiabilities)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Long-term Liabilities</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Long-term Loans: {formatCurrency(balanceSheet.liabilities.longTerm.longTermLoans)}</Typography>
                <Typography>Bonds: {formatCurrency(balanceSheet.liabilities.longTerm.bonds)}</Typography>
                <Typography>Other Long-term Liabilities: {formatCurrency(balanceSheet.liabilities.longTerm.otherLongTermLiabilities)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Equity</Typography>
          <Paper sx={{ p: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Common Stock: {formatCurrency(balanceSheet.equity.commonStock)}</Typography>
                <Typography>Retained Earnings: {formatCurrency(balanceSheet.equity.retainedEarnings)}</Typography>
                <Typography>Other Equity: {formatCurrency(balanceSheet.equity.otherEquity)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Revenue</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Sales: {formatCurrency(incomeStatement.revenue.sales)}</Typography>
                <Typography>Service: {formatCurrency(incomeStatement.revenue.service)}</Typography>
                <Typography>Other Revenue: {formatCurrency(incomeStatement.revenue.other)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Cost of Goods Sold</Typography>
            <Typography>{formatCurrency(incomeStatement.costOfGoodsSold)}</Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>Gross Profit</Typography>
            <Typography>{formatCurrency(incomeStatement.grossProfit)}</Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>Operating Expenses</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Salaries: {formatCurrency(incomeStatement.operatingExpenses.salaries)}</Typography>
                <Typography>Rent: {formatCurrency(incomeStatement.operatingExpenses.rent)}</Typography>
                <Typography>Utilities: {formatCurrency(incomeStatement.operatingExpenses.utilities)}</Typography>
                <Typography>Marketing: {formatCurrency(incomeStatement.operatingExpenses.marketing)}</Typography>
                <Typography>Depreciation: {formatCurrency(incomeStatement.operatingExpenses.depreciation)}</Typography>
                <Typography>Other Expenses: {formatCurrency(incomeStatement.operatingExpenses.other)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Operating Income</Typography>
            <Typography>{formatCurrency(incomeStatement.operatingIncome)}</Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>Other Income/Expenses</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Other Income: {formatCurrency(incomeStatement.otherIncome)}</Typography>
                <Typography>Other Expenses: {formatCurrency(incomeStatement.otherExpenses)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Net Income</Typography>
            <Typography>{formatCurrency(incomeStatement.netIncome)}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderCashFlowStatement = () => {
    if (!cashFlowStatement) return null;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Operating Activities</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Net Income: {formatCurrency(cashFlowStatement.operating.netIncome)}</Typography>
                <Typography>Depreciation: {formatCurrency(cashFlowStatement.operating.adjustments.depreciation)}</Typography>
                <Typography>Accounts Receivable: {formatCurrency(cashFlowStatement.operating.adjustments.accountsReceivable)}</Typography>
                <Typography>Inventory: {formatCurrency(cashFlowStatement.operating.adjustments.inventory)}</Typography>
                <Typography>Accounts Payable: {formatCurrency(cashFlowStatement.operating.adjustments.accountsPayable)}</Typography>
                <Typography>Other Adjustments: {formatCurrency(cashFlowStatement.operating.adjustments.other)}</Typography>
                <Typography variant="subtitle1">Net Cash from Operations: {formatCurrency(cashFlowStatement.operating.netCashFromOperations)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Investing Activities</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Purchase of Assets: {formatCurrency(cashFlowStatement.investing.purchaseOfAssets)}</Typography>
                <Typography>Sale of Assets: {formatCurrency(cashFlowStatement.investing.saleOfAssets)}</Typography>
                <Typography>Investments: {formatCurrency(cashFlowStatement.investing.investments)}</Typography>
                <Typography>Other Investing: {formatCurrency(cashFlowStatement.investing.other)}</Typography>
                <Typography variant="subtitle1">Net Cash from Investing: {formatCurrency(cashFlowStatement.investing.netCashFromInvesting)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Financing Activities</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Loans: {formatCurrency(cashFlowStatement.financing.loans)}</Typography>
                <Typography>Repayments: {formatCurrency(cashFlowStatement.financing.repayments)}</Typography>
                <Typography>Dividends: {formatCurrency(cashFlowStatement.financing.dividends)}</Typography>
                <Typography>Other Financing: {formatCurrency(cashFlowStatement.financing.other)}</Typography>
                <Typography variant="subtitle1">Net Cash from Financing: {formatCurrency(cashFlowStatement.financing.netCashFromFinancing)}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Cash Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Net Change in Cash: {formatCurrency(cashFlowStatement.netChangeInCash)}</Typography>
                <Typography>Beginning Cash: {formatCurrency(cashFlowStatement.beginningCash)}</Typography>
                <Typography>Ending Cash: {formatCurrency(cashFlowStatement.endingCash)}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderFinancialAnalysis = () => {
    if (!showAnalysis || !financialRatios || !ratioAnalysis) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Financial Analysis
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Liquidity Ratios</Typography>
              {Object.entries(ratioAnalysis)
                .filter(([key]) => key.includes('Ratio'))
                .map(([key, value]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{key.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                    <Typography>Value: {value.value.toFixed(2)}</Typography>
                    <Typography color="text.secondary">{value.analysis}</Typography>
                  </Box>
                ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Profitability Ratios</Typography>
              {Object.entries(ratioAnalysis)
                .filter(([key]) => key.includes('Margin') || key.includes('Return'))
                .map(([key, value]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{key.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                    <Typography>Value: {(value.value * 100).toFixed(2)}%</Typography>
                    <Typography color="text.secondary">{value.analysis}</Typography>
                  </Box>
                ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Efficiency Ratios</Typography>
              {Object.entries(ratioAnalysis)
                .filter(([key]) => key.includes('Turnover'))
                .map(([key, value]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{key.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                    <Typography>Value: {value.value.toFixed(2)}</Typography>
                    <Typography color="text.secondary">{value.analysis}</Typography>
                  </Box>
                ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Leverage Ratios</Typography>
              {Object.entries(ratioAnalysis)
                .filter(([key]) => key.includes('debt') || key.includes('interest'))
                .map(([key, value]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{key.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                    <Typography>Value: {value.value.toFixed(2)}</Typography>
                    <Typography color="text.secondary">{value.analysis}</Typography>
                  </Box>
                ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Balance Sheet" />
          <Tab label="Income Statement" />
          <Tab label="Cash Flow Statement" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              label="Statement Type"
              value={statementType}
              onChange={(e) => setStatementType(e.target.value as StatementType)}
              fullWidth
            >
              <MenuItem value="balance_sheet">Balance Sheet</MenuItem>
              <MenuItem value="income_statement">Income Statement</MenuItem>
              <MenuItem value="cash_flow">Cash Flow Statement</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newDate) => newDate && setStartDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newDate) => newDate && setEndDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Generating...' : 'Generate Statement'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Tooltip title="Export to Excel">
              <IconButton onClick={handleExportExcel} disabled={loading}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Tooltip title="Export to PDF">
              <IconButton onClick={handleExportPDF} disabled={loading}>
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Tooltip title="Show Financial Analysis">
              <IconButton onClick={handleShowAnalysis} disabled={loading}>
                <AssessmentIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>

      <TabPanel value={selectedTab} index={0}>
        {renderBalanceSheet()}
      </TabPanel>
      <TabPanel value={selectedTab} index={1}>
        {renderIncomeStatement()}
      </TabPanel>
      <TabPanel value={selectedTab} index={2}>
        {renderCashFlowStatement()}
      </TabPanel>

      {renderFinancialAnalysis()}
    </Box>
  );
}; 