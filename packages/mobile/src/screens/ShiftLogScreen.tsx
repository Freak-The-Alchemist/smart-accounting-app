import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Surface,
  Card,
  List,
  Dialog,
  Portal,
  Divider
} from 'react-native-paper';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import { LoadingSkeleton } from '@smart-accounting/shared/components/LoadingSkeleton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createShift,
  updateShift,
  getActiveShift,
  getFuelSalesByShift,
  getExpensesByShift
} from '@smart-accounting/shared/services/firebase';
import type { Shift, FuelSale, Expense } from '@smart-accounting/shared/types/petrolStation';

export const ShiftLogScreen = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadActiveShift();
  }, []);

  useEffect(() => {
    if (activeShift) {
      loadShiftData();
    }
  }, [activeShift]);

  const loadActiveShift = async () => {
    if (!user) return;
    try {
      const shift = await getActiveShift(user.id);
      setActiveShift(shift);
    } catch (error) {
      Alert.alert('Error', 'Failed to load active shift.');
    }
  };

  const loadShiftData = async () => {
    if (!activeShift) return;
    try {
      const [salesData, expensesData] = await Promise.all([
        getFuelSalesByShift(activeShift.id),
        getExpensesByShift(activeShift.id)
      ]);
      setSales(salesData);
      setExpenses(expensesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shift data.');
    }
  };

  const handleStartShift = async () => {
    if (!user) return;
    if (!openingBalance) {
      Alert.alert('Error', 'Please enter opening balance.');
      return;
    }

    setLoading(true);
    try {
      const shift: Omit<Shift, 'id'> = {
        attendantId: user.id,
        startTime: new Date(),
        status: 'active',
        openingBalance: parseFloat(openingBalance),
        totalSales: 0,
        totalExpenses: 0
      };

      const newShift = await createShift(shift);
      setActiveShift(newShift);
      setOpeningBalance('');
      Alert.alert('Success', 'Shift started successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to start shift.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift || !closingBalance) {
      Alert.alert('Error', 'Please enter closing balance.');
      return;
    }

    setLoading(true);
    try {
      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      await updateShift(activeShift.id, {
        endTime: new Date(),
        status: 'completed',
        closingBalance: parseFloat(closingBalance),
        totalSales,
        totalExpenses
      });

      setActiveShift(null);
      setClosingBalance('');
      setShowEndShiftDialog(false);
      Alert.alert('Success', 'Shift ended successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to end shift.');
    } finally {
      setLoading(false);
    }
  };

  const calculateExpectedBalance = () => {
    if (!activeShift) return 0;
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return activeShift.openingBalance + totalSales - totalExpenses;
  };

  if (loading) {
    return <LoadingSkeleton type="form" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView>
        <Surface style={styles.surface}>
          {!activeShift ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.title}>
                  Start New Shift
                </Text>
                <TextInput
                  label="Opening Balance"
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  right={<TextInput.Affix text="₹" />}
                />
                <Button
                  mode="contained"
                  onPress={handleStartShift}
                  style={styles.button}
                  loading={loading}
                >
                  Start Shift
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <>
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.title}>
                    Active Shift
                  </Text>
                  <List.Item
                    title="Start Time"
                    description={new Date(activeShift.startTime).toLocaleString()}
                    left={props => <List.Icon {...props} icon="clock-start" />}
                  />
                  <List.Item
                    title="Opening Balance"
                    description={`₹${activeShift.openingBalance.toFixed(2)}`}
                    left={props => <List.Icon {...props} icon="cash" />}
                  />
                  <List.Item
                    title="Total Sales"
                    description={`₹${sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}`}
                    left={props => <List.Icon {...props} icon="cart" />}
                  />
                  <List.Item
                    title="Total Expenses"
                    description={`₹${expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}`}
                    left={props => <List.Icon {...props} icon="cash-remove" />}
                  />
                  <List.Item
                    title="Expected Balance"
                    description={`₹${calculateExpectedBalance().toFixed(2)}`}
                    left={props => <List.Icon {...props} icon="calculator" />}
                  />
                  <Button
                    mode="contained"
                    onPress={() => setShowEndShiftDialog(true)}
                    style={styles.button}
                    loading={loading}
                  >
                    End Shift
                  </Button>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.title}>
                    Shift Summary
                  </Text>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Sales
                  </Text>
                  {sales.map((sale) => (
                    <List.Item
                      key={sale.id}
                      title={`${sale.liters}L ${sale.fuelType}`}
                      description={`${sale.paymentMethod} • ${new Date(sale.timestamp).toLocaleTimeString()}`}
                      right={() => (
                        <Text variant="titleMedium">₹{sale.totalAmount.toFixed(2)}</Text>
                      )}
                    />
                  ))}
                  {sales.length === 0 && (
                    <Text style={styles.emptyText}>No sales recorded</Text>
                  )}

                  <Divider style={styles.divider} />

                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Expenses
                  </Text>
                  {expenses.map((expense) => (
                    <List.Item
                      key={expense.id}
                      title={expense.description}
                      description={`${expense.category} • ${new Date(expense.timestamp).toLocaleTimeString()}`}
                      right={() => (
                        <Text variant="titleMedium">₹{expense.amount.toFixed(2)}</Text>
                      )}
                    />
                  ))}
                  {expenses.length === 0 && (
                    <Text style={styles.emptyText}>No expenses recorded</Text>
                  )}
                </Card.Content>
              </Card>
            </>
          )}
        </Surface>
      </ScrollView>

      <Portal>
        <Dialog visible={showEndShiftDialog} onDismiss={() => setShowEndShiftDialog(false)}>
          <Dialog.Title>End Shift</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Closing Balance"
              value={closingBalance}
              onChangeText={setClosingBalance}
              keyboardType="decimal-pad"
              style={styles.input}
              right={<TextInput.Affix text="₹" />}
            />
            <Text variant="bodySmall" style={styles.expectedBalance}>
              Expected Balance: ₹{calculateExpectedBalance().toFixed(2)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEndShiftDialog(false)}>Cancel</Button>
            <Button onPress={handleEndShift} loading={loading}>End Shift</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  surface: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 16,
  },
  expectedBalance: {
    marginTop: 8,
    opacity: 0.7,
  },
}); 