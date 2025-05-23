import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { z } from 'zod';
import { useDataSync } from '../hooks/useDataSync';
import { ValidationErrors } from './ValidationErrors';

// Define the sales entry schema
const salesEntrySchema = z.object({
  date: z.string(),
  fuelType: z.string().min(1, 'Fuel type is required'),
  volume: z.number().positive('Volume must be positive'),
  price: z.number().positive('Price must be positive'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE']),
  notes: z.string().optional(),
});

type SalesEntry = z.infer<typeof salesEntrySchema>;

interface SalesEntryFormProps {
  onClose: () => void;
}

export function SalesEntryForm({ onClose }: SalesEntryFormProps) {
  const [formData, setFormData] = useState<Partial<SalesEntry>>({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
  });
  const [validationError, setValidationError] = useState<z.ZodError | null>(null);

  // Use our data sync hook
  const {
    data: salesEntries,
    isLoading,
    error,
    conflicts,
    updateDocument,
    resolveConflict,
  } = useDataSync<SalesEntry>({
    collection: 'sales',
    query: [
      {
        field: 'date',
        operator: '==',
        value: formData.date,
      },
    ],
    orderBy: {
      field: 'timestamp',
      direction: 'desc',
    },
    optimisticUpdates: true,
    conflictResolution: 'last-write-wins',
    validationSchema: salesEntrySchema,
  });

  // Auto-calculate total when volume or price changes
  useEffect(() => {
    if (formData.volume && formData.price) {
      const total = formData.volume * formData.price;
      setFormData(prev => ({
        ...prev,
        total: Number(total.toFixed(2))
      }));
    }
  }, [formData.volume, formData.price]);

  const handleChange = (field: keyof SalesEntry) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'volume' || field === 'price' || field === 'total'
        ? parseFloat(value) || 0
        : value,
    }));
    setValidationError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const validatedData = salesEntrySchema.parse(formData);
      await updateDocument('new', validatedData);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationError(err);
      } else {
        console.error('Error:', err);
      }
    }
  };

  const handleConflictResolution = async (
    docId: string,
    resolution: 'server' | 'client' | 'merge'
  ) => {
    try {
      await resolveConflict(docId, resolution);
    } catch (err) {
      console.error('Conflict resolution error:', err);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        New Sales Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {validationError && (
        <ValidationErrors errors={validationError} />
      )}

      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={handleChange('date')}
            InputLabelProps={{ shrink: true }}
            required
            error={!!validationError?.formErrors.fieldErrors.date}
            helperText={validationError?.formErrors.fieldErrors.date?.[0]}
          />

          <TextField
            label="Fuel Type"
            value={formData.fuelType || ''}
            onChange={handleChange('fuelType')}
            required
            error={!!validationError?.formErrors.fieldErrors.fuelType}
            helperText={validationError?.formErrors.fieldErrors.fuelType?.[0]}
          />

          <TextField
            label="Volume (Liters)"
            type="number"
            value={formData.volume || ''}
            onChange={handleChange('volume')}
            required
            error={!!validationError?.formErrors.fieldErrors.volume}
            helperText={validationError?.formErrors.fieldErrors.volume?.[0]}
          />

          <TextField
            label="Price per Liter"
            type="number"
            value={formData.price || ''}
            onChange={handleChange('price')}
            required
            error={!!validationError?.formErrors.fieldErrors.price}
            helperText={validationError?.formErrors.fieldErrors.price?.[0]}
          />

          <TextField
            label="Total Amount"
            type="number"
            value={formData.total || ''}
            onChange={handleChange('total')}
            required
            error={!!validationError?.formErrors.fieldErrors.total}
            helperText={validationError?.formErrors.fieldErrors.total?.[0]}
            disabled
          />

          <TextField
            label="Payment Method"
            select
            value={formData.paymentMethod || 'CASH'}
            onChange={handleChange('paymentMethod')}
            SelectProps={{ native: true }}
            required
            error={!!validationError?.formErrors.fieldErrors.paymentMethod}
            helperText={validationError?.formErrors.fieldErrors.paymentMethod?.[0]}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="MOBILE">Mobile Payment</option>
          </TextField>

          <TextField
            label="Notes"
            multiline
            rows={2}
            value={formData.notes || ''}
            onChange={handleChange('notes')}
            error={!!validationError?.formErrors.fieldErrors.notes}
            helperText={validationError?.formErrors.fieldErrors.notes?.[0]}
          />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Save Entry
            </Button>
          </Box>
        </Box>
      </form>

      {/* Conflict Resolution Dialog */}
      {conflicts.size > 0 && (
        <Dialog open={conflicts.size > 0} maxWidth="sm" fullWidth>
          <DialogTitle>Resolve Conflicts</DialogTitle>
          <DialogContent>
            {Array.from(conflicts.entries()).map(([docId, conflict]) => (
              <Box key={docId} mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Conflict detected for entry {docId}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={() => handleConflictResolution(docId, 'server')}
                  >
                    Use Server Version
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleConflictResolution(docId, 'client')}
                  >
                    Use Local Version
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      handleConflictResolution(docId, 'merge')
                    }
                  >
                    Merge Changes
                  </Button>
                </Box>
              </Box>
            ))}
          </DialogContent>
        </Dialog>
      )}
    </Paper>
  );
} 