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
  TextInput,
  Dialog,
  Portal,
  Provider,
  List,
  Divider,
} from 'react-native-paper';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createShift,
  getActiveShift,
  endShift,
  createFuelSale,
} from '@smart-accounting/shared/services/firebase';
import { Shift, FuelSale, FuelType, PaymentMethod } from '@smart-accounting/shared/types/petrolStation';

export default function ShiftManagementScreen() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
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
      Alert.alert('Error', 'Failed to load active shift');
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
      Alert.alert('Error', 'Failed to start shift');
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
      Alert.alert('Error', 'Failed to end shift');
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
      Alert.alert('Error', 'Failed to add sale');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Shift Management</Title>

            {!activeShift ? (
              <Button
                mode="contained"
                onPress={startShift}
                disabled={loading}
                style={styles.button}
              >
                Start New Shift
              </Button>
            ) : (
              <View>
                <Paragraph>Active Shift</Paragraph>
                <Paragraph>
                  Started: {activeShift.startTime.toLocaleString()}
                </Paragraph>
                <Button
                  mode="contained"
                  onPress={() => setNewSaleDialog(true)}
                  style={styles.button}
                >
                  Add Sale
                </Button>
                <Button
                  mode="contained"
                  onPress={endShiftHandler}
                  style={[styles.button, styles.endButton]}
                >
                  End Shift
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {activeShift && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Today's Sales</Title>
              {activeShift.fuelSales.map((sale) => (
                <List.Item
                  key={sale.id}
                  title={sale.fuelType}
                  description={`${sale.quantity}L - $${sale.totalAmount.toFixed(2)}`}
                  right={() => <Paragraph>{sale.paymentMethod}</Paragraph>}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        <Portal>
          <Dialog visible={newSaleDialog} onDismiss={() => setNewSaleDialog(false)}>
            <Dialog.Title>Add New Sale</Dialog.Title>
            <Dialog.Content>
              <List.Item
                title="Fuel Type"
                right={() => (
                  <TextInput
                    value={newSale.fuelType}
                    onChangeText={(value) =>
                      setNewSale({ ...newSale, fuelType: value as FuelType })
                    }
                    style={styles.input}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Quantity (L)"
                right={() => (
                  <TextInput
                    value={newSale.quantity?.toString()}
                    onChangeText={(value) =>
                      setNewSale({
                        ...newSale,
                        quantity: parseFloat(value) || 0,
                      })
                    }
                    keyboardType="numeric"
                    style={styles.input}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Price per Liter"
                right={() => (
                  <TextInput
                    value={newSale.pricePerLiter?.toString()}
                    onChangeText={(value) =>
                      setNewSale({
                        ...newSale,
                        pricePerLiter: parseFloat(value) || 0,
                      })
                    }
                    keyboardType="numeric"
                    style={styles.input}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Payment Method"
                right={() => (
                  <TextInput
                    value={newSale.paymentMethod}
                    onChangeText={(value) =>
                      setNewSale({
                        ...newSale,
                        paymentMethod: value as PaymentMethod,
                      })
                    }
                    style={styles.input}
                  />
                )}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setNewSaleDialog(false)}>Cancel</Button>
              <Button onPress={addSale}>Add Sale</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </Provider>
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
  card: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  endButton: {
    backgroundColor: '#f44336',
  },
  input: {
    width: 120,
  },
}); 