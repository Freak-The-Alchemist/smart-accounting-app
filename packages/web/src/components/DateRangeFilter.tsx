import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Box,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatDateRange } from '@smart-accounting/shared/utils/filters';
import { theme } from '@smart-accounting/shared/theme';
import { TextFieldProps } from '@mui/material/TextField';

interface DateRangeFilterProps {
  onFilter: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export default function DateRangeFilter({
  onFilter,
  initialStart = '',
  initialEnd = ''
}: DateRangeFilterProps) {
  const [start, setStart] = useState<Date | null>(initialStart ? new Date(initialStart) : null);
  const [end, setEnd] = useState<Date | null>(initialEnd ? new Date(initialEnd) : null);
  const [error, setError] = useState('');

  const handleFilter = () => {
    if (!start || !end) {
      setError('Please select both start and end dates');
      return;
    }

    if (start > end) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    onFilter(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  return (
    <Card sx={{ m: 2, bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Date Range Filter
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={start}
                onChange={(newValue: Date | null) => setStart(newValue)}
                renderInput={(params: TextFieldProps) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!error}
                    helperText={error && !start ? error : ''}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={end}
                onChange={(newValue: Date | null) => setEnd(newValue)}
                renderInput={(params: TextFieldProps) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!error}
                    helperText={error && !end ? error : ''}
                  />
                )}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        {error ? (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : start && end ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {formatDateRange(
              start.toISOString().split('T')[0],
              end.toISOString().split('T')[0]
            )}
          </Typography>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleFilter}
            disabled={!start || !end}
            sx={{
              bgcolor: theme.colors.primary,
              '&:hover': {
                bgcolor: theme.colors.primaryDark,
              },
            }}
          >
            Apply Filter
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 