import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Account, JournalEntry } from '@smart-accounting/shared/types/accounting';
import { accountingService } from '@smart-accounting/shared/services/accountingService';
import { formatCurrency } from '../utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface AccountBreakdownProps {
  accountId: string;
  startDate: Date;
  endDate: Date;
}

export const AccountBreakdown: React.FC<AccountBreakdownProps> = ({
  accountId,
  startDate,
  endDate,
}) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [transactionType, setTransactionType] = useState<'all' | 'debit' | 'credit'>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [referenceFilter, setReferenceFilter] = useState<string>('');
  const [descriptionFilter, setDescriptionFilter] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  useEffect(() => {
    loadAccountData();
  }, [accountId, startDate, endDate]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const [accountData, entriesData] = await Promise.all([
        accountingService.getAccount(accountId),
        accountingService.getJournalEntries(startDate, endDate),
      ]);

      setAccount(accountData);
      setEntries(entriesData.filter(entry => 
        entry.entries.some(line => line.accountId === accountId)
      ));
    } catch (err) {
      setError('Failed to load account data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = (entries: JournalEntry[]): number => {
    return entries.reduce((balance, entry) => {
      const relevantLine = entry.entries.find(line => line.accountId === accountId);
      if (!relevantLine) return balance;

      if (account?.type === 'asset' || account?.type === 'expense') {
        return balance + (relevantLine.debit - relevantLine.credit);
      } else {
        return balance + (relevantLine.credit - relevantLine.debit);
      }
    }, 0);
  };

  const filterEntries = (entries: JournalEntry[]): JournalEntry[] => {
    return entries.filter(entry => {
      const relevantLine = entry.entries.find(line => line.accountId === accountId);
      if (!relevantLine) return false;

      const amount = relevantLine.debit - relevantLine.credit;
      const min = minAmount ? parseFloat(minAmount) : -Infinity;
      const max = maxAmount ? parseFloat(maxAmount) : Infinity;

      if (transactionType === 'debit' && relevantLine.debit <= 0) return false;
      if (transactionType === 'credit' && relevantLine.credit <= 0) return false;
      if (amount < min || amount > max) return false;
      if (referenceFilter && !entry.reference.toLowerCase().includes(referenceFilter.toLowerCase())) return false;
      if (descriptionFilter && !entry.description.toLowerCase().includes(descriptionFilter.toLowerCase())) return false;

      return true;
    });
  };

  const groupEntriesByTimeRange = (entries: JournalEntry[]): { [key: string]: JournalEntry[] } => {
    const grouped: { [key: string]: JournalEntry[] } = {};
    const filteredEntries = filterEntries(entries);

    filteredEntries.forEach(entry => {
      let key: string;
      const date = new Date(entry.date);

      switch (timeRange) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });

    return grouped;
  };

  const prepareChartData = (groupedEntries: { [key: string]: JournalEntry[] }) => {
    const data = Object.entries(groupedEntries).map(([key, entries]) => {
      const balance = calculateBalance(entries);
      const debits = entries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.debit || 0), 0);
      const credits = entries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.credit || 0), 0);

      return {
        date: timeRange === 'monthly' 
          ? new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : new Date(key).toLocaleDateString(),
        balance,
        debits,
        credits,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (chartType === 'pie') {
      return [
        { name: 'Debits', value: data.reduce((sum, item) => sum + item.debits, 0) },
        { name: 'Credits', value: data.reduce((sum, item) => sum + item.credits, 0) },
      ];
    }

    return data;
  };

  const exportToExcel = () => {
    if (!account) return;

    const groupedEntries = groupEntriesByTimeRange(entries);
    const sortedKeys = Object.keys(groupedEntries).sort();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([['']]);

    // Add header
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`${account.name} Account Breakdown`],
      [`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
      [''],
    ]);

    const rows: (string | number)[][] = [];

    sortedKeys.forEach(key => {
      const periodEntries = groupedEntries[key];
      const periodBalance = calculateBalance(periodEntries);
      const periodDebits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.debit || 0), 0);
      const periodCredits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.credit || 0), 0);

      rows.push([
        timeRange === 'monthly' 
          ? new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          : new Date(key).toLocaleDateString(),
        formatCurrency(periodDebits),
        formatCurrency(periodCredits),
        formatCurrency(periodBalance),
      ]);

      periodEntries.forEach(entry => {
        rows.push([
          '',
          new Date(entry.date).toLocaleDateString(),
          entry.reference,
          entry.description,
        ]);
      });

      rows.push(['']);
    });

    XLSX.utils.sheet_add_aoa(worksheet, [
      ['Period', 'Debits', 'Credits', 'Balance'],
      ['Transactions', 'Date', 'Reference', 'Description'],
      [''],
      ...rows,
    ], { origin: 'A4' });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Breakdown');
    XLSX.writeFile(workbook, `${account.name}_breakdown_${startDate.toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (!account) return;

    const doc = new jsPDF();
    const groupedEntries = groupEntriesByTimeRange(entries);
    const sortedKeys = Object.keys(groupedEntries).sort();

    // Add header
    doc.setFontSize(16);
    doc.text(`${account.name} Account Breakdown`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 25);

    let y = 35;
    sortedKeys.forEach(key => {
      const periodEntries = groupedEntries[key];
      const periodBalance = calculateBalance(periodEntries);
      const periodDebits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.debit || 0), 0);
      const periodCredits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.credit || 0), 0);

      (doc as any).autoTable({
        startY: y,
        head: [[
          timeRange === 'monthly' 
            ? new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
            : new Date(key).toLocaleDateString(),
          'Debits',
          'Credits',
          'Balance'
        ]],
        body: [[
          '',
          formatCurrency(periodDebits),
          formatCurrency(periodCredits),
          formatCurrency(periodBalance)
        ]],
        theme: 'grid',
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      (doc as any).autoTable({
        startY: y,
        head: [['Date', 'Reference', 'Description']],
        body: periodEntries.map(entry => [
          new Date(entry.date).toLocaleDateString(),
          entry.reference,
          entry.description
        ]),
        theme: 'grid',
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`${account.name}_breakdown_${startDate.toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    if (!account) return;

    const groupedEntries = groupEntriesByTimeRange(entries);
    const sortedKeys = Object.keys(groupedEntries).sort();
    const rows: (string | number)[][] = [
      [`${account.name} Account Breakdown`],
      [`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
      [''],
      ['Period', 'Debits', 'Credits', 'Balance'],
      ['Transactions', 'Date', 'Reference', 'Description'],
      [''],
    ];

    sortedKeys.forEach(key => {
      const periodEntries = groupedEntries[key];
      const periodBalance = calculateBalance(periodEntries);
      const periodDebits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.debit || 0), 0);
      const periodCredits = periodEntries.reduce((sum, entry) => 
        sum + (entry.entries.find(line => line.accountId === accountId)?.credit || 0), 0);

      rows.push([
        timeRange === 'monthly' 
          ? new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          : new Date(key).toLocaleDateString(),
        periodDebits,
        periodCredits,
        periodBalance,
      ]);

      periodEntries.forEach(entry => {
        rows.push([
          '',
          new Date(entry.date).toLocaleDateString(),
          entry.reference,
          entry.description,
        ]);
      });

      rows.push(['']);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${account.name}_breakdown_${startDate.toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      case 'csv':
        exportToCSV();
        break;
    }
  };

  const renderBreakdown = () => {
    if (!account || !entries.length) return null;

    const groupedEntries = groupEntriesByTimeRange(entries);
    const sortedKeys = Object.keys(groupedEntries).sort();
    const chartData = prepareChartData(groupedEntries);

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {account.name} Breakdown
        </Typography>

        <Box sx={{ height: 300, mb: 4 }}>
          {renderChart(chartData)}
        </Box>

        <Grid container spacing={2}>
          {sortedKeys.map(key => {
            const periodEntries = groupedEntries[key];
            const periodBalance = calculateBalance(periodEntries);
            const periodDebits = periodEntries.reduce((sum, entry) => 
              sum + (entry.entries.find(line => line.accountId === accountId)?.debit || 0), 0);
            const periodCredits = periodEntries.reduce((sum, entry) => 
              sum + (entry.entries.find(line => line.accountId === accountId)?.credit || 0), 0);

            return (
              <Grid item xs={12} key={key}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {timeRange === 'monthly' 
                      ? new Date(key + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                      : new Date(key).toLocaleDateString()}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Debits</Typography>
                      <Typography>{formatCurrency(periodDebits)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Credits</Typography>
                      <Typography>{formatCurrency(periodCredits)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Balance</Typography>
                      <Typography>{formatCurrency(periodBalance)}</Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Transactions</Typography>
                    {periodEntries.map(entry => (
                      <Box key={entry.id} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {new Date(entry.date).toLocaleDateString()} - {entry.reference}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderChart = (data: any[]) => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="debits" fill="#82ca9d" name="Debits" />
            <Bar dataKey="credits" fill="#ffc658" name="Credits" />
            <Bar dataKey="balance" fill="#8884d8" name="Balance" />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#82ca9d' : '#ffc658'} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        );
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Balance" />
            <Line type="monotone" dataKey="debits" stroke="#82ca9d" name="Debits" />
            <Line type="monotone" dataKey="credits" stroke="#ffc658" name="Credits" />
          </LineChart>
        );
    }
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
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value as 'daily' | 'weekly' | 'monthly')}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={transactionType}
              label="Transaction Type"
              onChange={(e) => setTransactionType(e.target.value as 'all' | 'debit' | 'credit')}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="debit">Debits Only</MenuItem>
              <MenuItem value="credit">Credits Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Min Amount"
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Max Amount"
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Reference Filter"
            value={referenceFilter}
            onChange={(e) => setReferenceFilter(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            fullWidth
            label="Description Filter"
            value={descriptionFilter}
            onChange={(e) => setDescriptionFilter(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              label="Export Format"
              onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf' | 'csv')}
            >
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export">
              <IconButton onClick={handleExport}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={(_, value) => value && setChartType(value)}
          aria-label="chart type"
        >
          <ToggleButton value="line" aria-label="line chart">
            <TableChartIcon />
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            <TableChartIcon />
          </ToggleButton>
          <ToggleButton value="pie" aria-label="pie chart">
            <TableChartIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {renderBreakdown()}
    </Box>
  );
}; 