import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAccounting } from '@smart-accounting/shared/hooks/useAccounting';
import { Account, JournalEntry, LedgerEntry } from '@smart-accounting/shared/models/AccountingEntry';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface JournalEntryFormProps {
  onSuccess?: () => void;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onSuccess }) => {
  const { createJournalEntry, loading, error } = useAccounting();
  const [date, setDate] = useState<Date>(new Date());
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<Partial<LedgerEntry>[]>([
    { debit: 0, credit: 0 },
    { debit: 0, credit: 0 },
  ]);

  const handleAddEntry = () => {
    setEntries([...entries, { debit: 0, credit: 0 }]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleEntryChange = (index: number, field: keyof LedgerEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const validateEntries = () => {
    const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    return Math.abs(totalDebits - totalCredits) < 0.01;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEntries()) {
      alert('Debits and credits must be equal');
      return;
    }

    try {
      const journalEntry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        date,
        reference,
        description,
        entries: entries.map(entry => ({
          ...entry,
          id: '',
          journalEntryId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as LedgerEntry[],
        createdBy: '',
      };

      await createJournalEntry(journalEntry);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create journal entry:', err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        New Journal Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newDate) => newDate && setDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              required
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Entries
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell width={50} />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        select
                        value={entry.accountId || ''}
                        onChange={(e) => handleEntryChange(index, 'accountId', e.target.value)}
                        fullWidth
                        required
                      >
                        {/* Account options will be added here */}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={entry.debit || 0}
                        onChange={(e) => handleEntryChange(index, 'debit', parseFloat(e.target.value))}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={entry.credit || 0}
                        onChange={(e) => handleEntryChange(index, 'credit', parseFloat(e.target.value))}
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={entry.description || ''}
                        onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleRemoveEntry(index)}
                        disabled={entries.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddEntry}
              variant="outlined"
            >
              Add Entry
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Journal Entry'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
}; 