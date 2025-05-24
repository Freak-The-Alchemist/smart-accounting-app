import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Container,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MoreVert as MoreVertIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import {
  getShiftsByDateRange,
  getFuelSalesByDateRange,
  getExpensesByDateRange,
  exportToExcel
} from '@smart-accounting/shared/services/firebase';
import type { Shift, FuelSale, Expense } from '@smart-accounting/shared/types/petrolStation';
import { DocumentScanner } from '../components/DocumentScanner';
import { VoiceInput } from '../components/VoiceInput';
import { AccountingEntry } from '@smart-accounting/shared/types/accounting';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { processOCRText, processVoiceText, createAccountingEntry } from '@smart-accounting/shared/services/inputProcessing';
import { OCRVoiceInput } from '../components/OCRVoiceInput';

export const AccountingPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sector, setSector] = useState<'general' | 'fuel'>('general');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: 0,
    date: new Date(),
    description: '',
  });

  useEffect(() => {
    if (!user) return;

    const entriesRef = collection(db, 'accounting_entries');
    const q = query(
      entriesRef,
      where('createdBy', '==', user.uid),
      where('sector', '==', sector),
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
  }, [user, sector]);

  const handleScanComplete = async (text: string) => {
    if (!user) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processedData = await processOCRText(text);
      const entry = createAccountingEntry(processedData, user.uid, sector);
      
      const entriesRef = collection(db, 'accounting_entries');
      await addDoc(entriesRef, entry);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceComplete = async (text: string) => {
    if (!user) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processedData = await processVoiceText(text);
      const entry = createAccountingEntry(processedData, user.uid, sector);
      
      const entriesRef = collection(db, 'accounting_entries');
      await addDoc(entriesRef, entry);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransactionDataExtracted = (data: {
    amount: number;
    date: Date;
    vendor: string;
    items: string[];
  }) => {
    // Pre-fill the transaction form with extracted data
    setTransactionForm({
      ...transactionForm,
      amount: data.amount,
      date: data.date,
      description: `${data.vendor} - ${data.items.join(', ')}`,
    });
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Accounting
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <OCRVoiceInput onTransactionDataExtracted={handleTransactionDataExtracted} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Existing transaction form */}
            // ... existing code ...
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {sector === 'fuel' ? 'Fuel Station Accounting' : 'General Accounting'}
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Sector</InputLabel>
                  <Select
                    value={sector}
                    label="Sector"
                    onChange={(e) => setSector(e.target.value as 'general' | 'fuel')}
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="fuel">Fuel Station</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <DocumentScanner
                    onScanComplete={handleScanComplete}
                    onError={(err) => setError(err.message)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <VoiceInput
                    onTranscriptComplete={handleVoiceComplete}
                    onError={(err) => setError(err.message)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Entries
              </Typography>
              {isLoading || isProcessing ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : entries.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No entries found
                </Typography>
              ) : (
                <Box>
                  {entries.map((entry) => (
                    <Box key={entry.id} sx={{ mb: 2, p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1">{entry.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(entry.date).toLocaleDateString()}
                      </Typography>
                      <Typography
                        variant="body1"
                        color={entry.type === 'income' ? 'success.main' : 'error.main'}
                      >
                        {entry.type === 'income' ? '+' : '-'}${entry.amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Category: {entry.category}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 