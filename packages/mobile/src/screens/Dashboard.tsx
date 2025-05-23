import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { formatCurrency, formatDate } from '@smart-accounting/shared/utils/format';
import { FuelSale, Shift, Expense } from '@smart-accounting/shared/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySales, setTodaySales] = useState<FuelSale[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  const fetchData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's sales
      const salesQuery = query(
        collection(db, 'fuelSales'),
        where('date', '>=', today),
        orderBy('date', 'desc')
      );
      const salesSnapshot = await getDocs(salesQuery);
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));
      setTodaySales(sales);

      // Fetch active shift
      const shiftsQuery = query(
        collection(db, 'shifts'),
        where('endTime', '==', null),
        limit(1)
      );
      const shiftsSnapshot = await getDocs(shiftsQuery);
      if (!shiftsSnapshot.empty) {
        setActiveShift({ id: shiftsSnapshot.docs[0].id, ...shiftsSnapshot.docs[0].data() } as Shift);
      }

      // Fetch recent expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        orderBy('date', 'desc'),
        limit(5)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setRecentExpenses(expenses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calculateTotalSales = () => {
    return todaySales.reduce((total, sale) => total + sale.totalAmount, 0);
  };

  const calculateTotalExpenses = () => {
    return recentExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>{formatCurrency(calculateTotalSales())}</Text>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>{formatCurrency(calculateTotalExpenses())}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Shift</Text>
        {activeShift ? (
          <View style={styles.shiftCard}>
            <Text style={styles.shiftLabel}>Started at</Text>
            <Text style={styles.shiftValue}>{formatDate(activeShift.startTime)}</Text>
            <Text style={styles.shiftLabel}>Attendant</Text>
            <Text style={styles.shiftValue}>{activeShift.attendantName}</Text>
          </View>
        ) : (
          <Text style={styles.noData}>No active shift</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {recentExpenses.length > 0 ? (
          recentExpenses.map(expense => (
            <View key={expense.id} style={styles.expenseCard}>
              <Text style={styles.expenseTitle}>{expense.description}</Text>
              <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
              <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No recent expenses</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  shiftCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shiftLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shiftValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  expenseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 18,
    color: '#2196F3',
    marginVertical: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#666',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
}); 