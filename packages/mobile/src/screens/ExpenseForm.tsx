import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons, List, ActivityIndicator } from 'react-native-paper';
import { collection, addDoc, Timestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { useAuth } from '../hooks/useAuth';
import { exportExpenses } from '../utils/excelExport';
import { Expense } from '@smart-accounting/shared/types/petrolStation';
import { theme } from '@smart-accounting/shared/theme';

const EXPENSE_CATEGORIES = [
  'Fuel Delivery',
  'Utilities',
  'Maintenance',
  'Supplies',
  'Other'
] as const;

const CATEGORY_ICONS = {
  'Fuel Delivery': 'truck',
  'Utilities': 'lightning-bolt',
  'Maintenance': 'wrench',
  'Supplies': 'package-variant',
  'Other': 'dots-horizontal'
} as const;

export default function ExpenseForm() {
  const { user } = useAuth();
  const [category, setCategory] = useState<typeof EXPENSE_CATEGORIES[number]>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expenses'),
      where('attendantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to record expenses');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        date: Timestamp.now().toDate().toISOString(),
        category,
        amount: parsedAmount,
        notes: notes.trim(),
        attendantId: user.uid
      });

      Alert.alert('Success', 'Expense recorded successfully');
      // Reset form
      setAmount('');
      setNotes('');
    } catch (error) {
      console.error('Error recording expense:', error);
      Alert.alert('Error', 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (expenses.length === 0) {
      Alert.alert('Info', 'No expenses to export');
      return;
    }

    setExporting(true);
    try {
      await exportExpenses(expenses);
      Alert.alert('Success', 'Expenses exported successfully');
    } catch (error) {
      console.error('Error exporting expenses:', error);
      Alert.alert('Error', 'Failed to export expenses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Record Expense</Text>

          <Text variant="bodyMedium" style={styles.label}>Category</Text>
          <SegmentedButtons
            value={category}
            onValueChange={value => setCategory(value as typeof EXPENSE_CATEGORIES[number])}
            buttons={EXPENSE_CATEGORIES.map(cat => ({
              value: cat,
              label: cat,
              icon: CATEGORY_ICONS[cat]
            }))}
            style={styles.segmentedButtons}
          />

          <Text variant="bodyMedium" style={styles.label}>Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Enter amount"
            left={<TextInput.Affix text="KES " />}
            mode="outlined"
          />

          <Text variant="bodyMedium" style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            placeholder="Add any additional details"
            multiline
            numberOfLines={3}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={theme.colors.primary}
          >
            Record Expense
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Expenses</Text>
            <Button
              mode="outlined"
              onPress={handleExport}
              loading={exporting}
              disabled={exporting || expenses.length === 0}
              icon="file-excel"
              textColor={theme.colors.primary}
              style={styles.exportButton}
            >
              Export
            </Button>
          </View>

          {expenses.length > 0 ? (
            expenses.slice(-5).map((expense) => (
              <List.Item
                key={expense.id}
                title={expense.category}
                description={`${new Date(expense.date).toLocaleDateString()} - KES ${expense.amount.toFixed(2)}`}
                left={props => (
                  <List.Icon 
                    {...props} 
                    icon={CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS]} 
                    color={theme.colors.primary}
                  />
                )}
                style={styles.listItem}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.noExpenses}>No expenses recorded yet</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
  },
  title: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.text,
    ...theme.typography.mobile.h1,
  },
  label: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.mobile.h2,
  },
  exportButton: {
    borderColor: theme.colors.primary,
  },
  noExpenses: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  listItem: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  listItemTitle: {
    color: theme.colors.text,
    ...theme.typography.mobile.body1,
  },
  listItemDescription: {
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
}); 