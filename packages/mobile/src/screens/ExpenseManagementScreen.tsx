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
} from 'react-native-paper';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import {
  createExpense,
  getExpenses,
  getActiveShift,
} from '@smart-accounting/shared/services/firebase';
import { Expense, ExpenseCategory } from '@smart-accounting/shared/types/petrolStation';

export default function ExpenseManagementScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [activeShift, setActiveShift] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpenseDialog, setNewExpenseDialog] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: ExpenseCategory.OTHER,
  });

  useEffect(() => {
    loadActiveShift();
  }, [user]);

  useEffect(() => {
    if (activeShift) {
      loadExpenses();
    }
  }, [activeShift]);

  const loadActiveShift = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const shift = await getActiveShift(user.id);
      setActiveShift(shift?.id || null);
    } catch (err) {
      setError('Failed to load active shift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!activeShift) return;

    try {
      setLoading(true);
      const expensesList = await getExpenses(activeShift);
      setExpenses(expensesList);
    } catch (err) {
      setError('Failed to load expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!activeShift || !newExpense.amount || !newExpense.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const expense: Omit<Expense, 'id'> = {
        shiftId: activeShift,
        amount: newExpense.amount,
        category: newExpense.category as ExpenseCategory,
        description: newExpense.description,
        timestamp: new Date(),
        attendantId: user!.id,
      };

      await createExpense(expense);
      setNewExpenseDialog(false);
      setNewExpense({});
      await loadExpenses();
    } catch (err) {
      setError('Failed to add expense');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
          <Title>Expense Management</Title>
          {!activeShift ? (
            <Paragraph>
              No active shift found. Please start a shift to manage expenses.
            </Paragraph>
          ) : (
            <Button
              mode="contained"
              onPress={() => setNewExpenseDialog(true)}
              style={styles.addButton}
            >
              Add Expense
            </Button>
          )}
        </Card.Content>
      </Card>

      {activeShift && (
        <Card style={styles.expensesCard}>
          <Card.Content>
            <Title>Today's Expenses</Title>
            {expenses.map((expense) => (
              <React.Fragment key={expense.id}>
                <List.Item
                  title={expense.category}
                  description={expense.description}
                  right={() => (
                    <View style={styles.expenseAmount}>
                      <Paragraph>${expense.amount.toFixed(2)}</Paragraph>
                      <Chip
                        mode="outlined"
                        style={styles.timestampChip}
                      >
                        {expense.timestamp.toLocaleTimeString()}
                      </Chip>
                    </View>
                  )}
                />
                <Divider />
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      )}

      <Portal>
        <Dialog
          visible={newExpenseDialog}
          onDismiss={() => setNewExpenseDialog(false)}
        >
          <Dialog.Title>Add New Expense</Dialog.Title>
          <Dialog.Content>
            <List.Item
              title="Category"
              right={() => (
                <View style={styles.categoryContainer}>
                  {Object.values(ExpenseCategory).map((category) => (
                    <Chip
                      key={category}
                      selected={newExpense.category === category}
                      onPress={() =>
                        setNewExpense({
                          ...newExpense,
                          category: category as ExpenseCategory,
                        })
                      }
                      style={styles.categoryChip}
                    >
                      {category}
                    </Chip>
                  ))}
                </View>
              )}
            />
            <TextInput
              label="Amount"
              value={newExpense.amount?.toString() || ''}
              onChangeText={(text) =>
                setNewExpense({
                  ...newExpense,
                  amount: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={newExpense.description || ''}
              onChangeText={(text) =>
                setNewExpense({
                  ...newExpense,
                  description: text,
                })
              }
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNewExpenseDialog(false)}>Cancel</Button>
            <Button onPress={addExpense}>Add Expense</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
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
  expensesCard: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  timestampChip: {
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  categoryChip: {
    margin: 4,
  },
  input: {
    marginBottom: 16,
  },
}); 