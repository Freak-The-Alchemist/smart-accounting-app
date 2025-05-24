import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Dialog,
  Portal,
  TextInput,
  List,
  Divider,
  Chip,
  useTheme,
  FAB,
} from 'react-native-paper';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createStockItem,
  updateStockItem,
  getLowStockItems,
} from '@smart-accounting/shared/services/firebase';
import { StockItem } from '@smart-accounting/shared/types/petrolStation';

export default function InventoryManagementScreen() {
  const { user } = useAuth();
  const theme = useTheme();
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
      Alert.alert('Error', 'Please fill in all required fields');
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
      Alert.alert('Error', 'Please fill in all required fields');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Paragraph style={{ color: theme.colors.error }}>
                {error}
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>Inventory Management</Title>
          </Card.Content>
        </Card>

        <Card style={styles.stockCard}>
          <Card.Content>
            <Title>Stock Items</Title>
            {stockItems.map((item) => (
              <React.Fragment key={item.id}>
                <List.Item
                  title={item.name}
                  description={`${item.quantity} ${item.unit}`}
                  right={() => (
                    <View style={styles.itemDetails}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.quantityChip,
                          item.quantity <= item.minimumQuantity && {
                            backgroundColor: theme.colors.error,
                          },
                        ]}
                      >
                        Min: {item.minimumQuantity}
                      </Chip>
                      <Button
                        mode="text"
                        onPress={() => handleEditClick(item)}
                        style={styles.editButton}
                      >
                        Edit
                      </Button>
                    </View>
                  )}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setNewItemDialog(true)}
      />

      <Portal>
        <Dialog
          visible={newItemDialog}
          onDismiss={() => setNewItemDialog(false)}
        >
          <Dialog.Title>Add New Stock Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newItem.name || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  name: text,
                })
              }
              style={styles.input}
            />
            <TextInput
              label="Quantity"
              value={newItem.quantity?.toString() || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  quantity: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Unit"
              value={newItem.unit || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  unit: text,
                })
              }
              style={styles.input}
            />
            <TextInput
              label="Minimum Quantity"
              value={newItem.minimumQuantity?.toString() || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  minimumQuantity: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Notes"
              value={newItem.notes || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  notes: text,
                })
              }
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNewItemDialog(false)}>Cancel</Button>
            <Button onPress={handleAddItem}>Add Item</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={editItemDialog}
          onDismiss={() => setEditItemDialog(false)}
        >
          <Dialog.Title>Update Stock Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="New Quantity"
              value={newItem.quantity?.toString() || ''}
              onChangeText={(text) =>
                setNewItem({
                  ...newItem,
                  quantity: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditItemDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateItem}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    marginBottom: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  stockCard: {
    marginBottom: 16,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  quantityChip: {
    marginBottom: 4,
  },
  editButton: {
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 