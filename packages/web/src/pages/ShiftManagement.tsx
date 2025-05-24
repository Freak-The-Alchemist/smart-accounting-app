import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createShift,
  getActiveShift,
  endShift,
  getFuelSales,
  createFuelSale,
} from '@smart-accounting/shared/services/firebase';
import { Shift, FuelSale, FuelType, PaymentMethod } from '@smart-accounting/shared/types/petrolStation';

export default function ShiftManagement() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSaleDialog, setNewSaleDialog] = useState(false);
  const [newSale, setNewSale] = useState<Partial<FuelSale>>({
    fuelType: FuelType.PETROL,
    paymentMethod: PaymentMethod.CASH,
  });

  useEffect(() => {
    loadActiveShift();
  }, [user]);

  const loadActiveShift = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const shift = await getActiveShift(user.id);
      setActiveShift(shift);
    } catch (err) {
      setError('Failed to load active shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startShift = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const startingCash = 0; // You might want to get this from user input
      const shiftId = await createShift({
        attendantId: user.id,
        startTime: new Date(),
        startingCash,
        status: 'ACTIVE',
        fuelSales: [],
        expenses: [],
      });
      await loadActiveShift();
    } catch (err) {
      setError('Failed to start shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const endShiftHandler = async () => {
    if (!activeShift) return;

    try {
      setLoading(true);
      const endingCash = 0; // You might want to get this from user input
      await endShift(activeShift.id, endingCash);
      setActiveShift(null);
    } catch (err) {
      setError('Failed to end shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSale = async () => {
    if (!activeShift || !newSale.quantity || !newSale.pricePerLiter) return;

    try {
      setLoading(true);
      const sale: Omit<FuelSale, 'id'> = {
        shiftId: activeShift.id,
        fuelType: newSale.fuelType as FuelType,
        quantity: newSale.quantity,
        pricePerLiter: newSale.pricePerLiter,
        totalAmount: newSale.quantity * newSale.pricePerLiter,
        paymentMethod: newSale.paymentMethod as PaymentMethod,
        timestamp: new Date(),
        attendantId: user!.id,
      };

      await createFuelSale(sale);
      setNewSaleDialog(false);
      setNewSale({});
      await loadActiveShift();
    } catch (err) {
      setError('Failed to add sale');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Shift Management
          </Typography>

          {!activeShift ? (
            <Button
              variant="contained"
              color="primary"
              onClick={startShift}
              disabled={loading}
            >
              Start New Shift
            </Button>
          ) : (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Active Shift
              </Typography>
              <Typography>
                Started: {activeShift.startTime.toLocaleString()}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setNewSaleDialog(true)}
                sx={{ mt: 2, mr: 2 }}
              >
                Add Sale
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={endShiftHandler}
                sx={{ mt: 2 }}
              >
                End Shift
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {activeShift && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today's Sales
            </Typography>
            <Grid container spacing={2}>
              {activeShift.fuelSales.map((sale) => (
                <Grid item xs={12} sm={6} md={4} key={sale.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {sale.fuelType}
                      </Typography>
                      <Typography>
                        Quantity: {sale.quantity}L
                      </Typography>
                      <Typography>
                        Amount: ${sale.totalAmount.toFixed(2)}
                      </Typography>
                      <Typography>
                        Payment: {sale.paymentMethod}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog open={newSaleDialog} onClose={() => setNewSaleDialog(false)}>
        <DialogTitle>Add New Sale</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              fullWidth
              label="Fuel Type"
              value={newSale.fuelType}
              onChange={(e) =>
                setNewSale({ ...newSale, fuelType: e.target.value as FuelType })
              }
              SelectProps={{
                native: true,
              }}
              sx={{ mb: 2 }}
            >
              {Object.values(FuelType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Quantity (L)"
              type="number"
              value={newSale.quantity || ''}
              onChange={(e) =>
                setNewSale({
                  ...newSale,
                  quantity: parseFloat(e.target.value),
                })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Price per Liter"
              type="number"
              value={newSale.pricePerLiter || ''}
              onChange={(e) =>
                setNewSale({
                  ...newSale,
                  pricePerLiter: parseFloat(e.target.value),
                })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              select
              fullWidth
              label="Payment Method"
              value={newSale.paymentMethod}
              onChange={(e) =>
                setNewSale({
                  ...newSale,
                  paymentMethod: e.target.value as PaymentMethod,
                })
              }
              SelectProps={{
                native: true,
              }}
            >
              {Object.values(PaymentMethod).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSaleDialog(false)}>Cancel</Button>
          <Button onClick={addSale} variant="contained" color="primary">
            Add Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 