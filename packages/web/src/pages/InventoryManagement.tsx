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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createStockItem,
  updateStockItem,
  getLowStockItems,
} from '@smart-accounting/shared/services/firebase';
import { StockItem } from '@smart-accounting/shared/types/petrolStation';

export default function InventoryManagement() {
  const { user } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    quantity: 0,
    minimumQuantity: 0,
  });

  useEffect(() => {
    if (user?.stationId) {
      loadStockItems();
    }
  }, [user]);

  const loadStockItems = async () => {
    if (!user?.stationId) return;

    try {
      setLoading(true);
      const items = await getLowStockItems(user.stationId);
      setStockItems(items);
    } catch (err) {
      setError('Failed to load stock items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user?.stationId || !newItem.name || !newItem.unit) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const item: Omit<StockItem, 'id'> = {
        stationId: user.stationId,
        name: newItem.name,
        quantity: newItem.quantity || 0,
        unit: newItem.unit,
        minimumQuantity: newItem.minimumQuantity || 0,
        lastUpdated: new Date(),
        notes: newItem.notes,
      };

      await createStockItem(item);
      setNewItemDialog(false);
      setNewItem({});
      await loadStockItems();
    } catch (err) {
      setError('Failed to add stock item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !newItem.quantity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await updateStockItem(selectedItem.id, newItem.quantity);
      setEditItemDialog(false);
      setSelectedItem(null);
      setNewItem({});
      await loadStockItems();
    } catch (err) {
      setError('Failed to update stock item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item: StockItem) => {
    setSelectedItem(item);
    setNewItem({ quantity: item.quantity });
    setEditItemDialog(true);
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
            Inventory Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setNewItemDialog(true)}
            sx={{ mt: 2 }}
          >
            Add Stock Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stock Items
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Minimum Quantity</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.minimumQuantity}</TableCell>
                    <TableCell>
                      {item.lastUpdated.toLocaleString()}
                    </TableCell>
                    <TableCell>{item.notes}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEditClick(item)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={newItemDialog} onClose={() => setNewItemDialog(false)}>
        <DialogTitle>Add New Stock Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newItem.name || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  name: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={newItem.quantity || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  quantity: parseFloat(e.target.value),
                })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Unit"
              value={newItem.unit || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  unit: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Minimum Quantity"
              type="number"
              value={newItem.minimumQuantity || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  minimumQuantity: parseFloat(e.target.value),
                })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newItem.notes || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  notes: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewItemDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" color="primary">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editItemDialog} onClose={() => setEditItemDialog(false)}>
        <DialogTitle>Update Stock Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="New Quantity"
              type="number"
              value={newItem.quantity || ''}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  quantity: parseFloat(e.target.value),
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateItem} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 