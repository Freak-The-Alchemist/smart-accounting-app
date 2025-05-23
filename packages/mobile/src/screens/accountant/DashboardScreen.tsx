import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { formatCurrency, formatDate } from '@smart-accounting/shared/utils/format';
import { FuelSale, Expense } from '@smart-accounting/shared/types';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState<FuelSale[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's sales
      const salesQuery = query(
        collection(db, 'fuelSales'),
        where('date', '>=', today)
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));
      setTodaySales(salesData);

      // Fetch today's expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('date', '>=', today)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setTodayExpenses(expensesData);

      // Calculate monthly stats
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlySalesQuery = query(
        collection(db, 'fuelSales'),
        where('date', '>=', firstDayOfMonth)
      );
      const monthlyExpensesQuery = query(
        collection(db, 'expenses'),
        where('date', '>=', firstDayOfMonth)
      );

      const [monthlySalesSnapshot, monthlyExpensesSnapshot] = await Promise.all([
        getDocs(monthlySalesQuery),
        getDocs(monthlyExpensesQuery),
      ]);

      const totalSales = monthlySalesSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data() as FuelSale).totalAmount,
        0
      );
      const totalExpenses = monthlyExpensesSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data() as Expense).amount,
        0
      );

      setMonthlyStats({
        totalSales,
        totalExpenses,
        netIncome: totalSales - totalExpenses,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayNetIncome = todayTotal - todayExpensesTotal;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Overview</Text>
        <Text style={styles.subtitle}>{formatDate(new Date())}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today's Sales</Text>
          <Text style={styles.statValue}>{formatCurrency(todayTotal)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today's Expenses</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {formatCurrency(todayExpensesTotal)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today's Net Income</Text>
          <Text style={[styles.statValue, { color: todayNetIncome >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatCurrency(todayNetIncome)}
          </Text>
        </View>
      </View>

      <View style={styles.monthlyContainer}>
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.monthlyStats}>
          <View style={styles.monthlyStat}>
            <Text style={styles.monthlyLabel}>Total Sales</Text>
            <Text style={styles.monthlyValue}>
              {formatCurrency(monthlyStats.totalSales)}
            </Text>
          </View>
          <View style={styles.monthlyStat}>
            <Text style={styles.monthlyLabel}>Total Expenses</Text>
            <Text style={[styles.monthlyValue, { color: '#F44336' }]}>
              {formatCurrency(monthlyStats.totalExpenses)}
            </Text>
          </View>
          <View style={styles.monthlyStat}>
            <Text style={styles.monthlyLabel}>Net Income</Text>
            <Text style={[styles.monthlyValue, { color: monthlyStats.netIncome >= 0 ? '#4CAF50' : '#F44336' }]}>
              {formatCurrency(monthlyStats.netIncome)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {todaySales.slice(0, 5).map(sale => (
          <View key={sale.id} style={styles.transaction}>
            <View>
              <Text style={styles.transactionTitle}>{sale.fuelType}</Text>
              <Text style={styles.transactionTime}>
                {new Date(sale.date).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.transactionAmount}>
              {formatCurrency(sale.totalAmount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthlyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  monthlyStats: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  monthlyStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  monthlyLabel: {
    fontSize: 16,
    color: '#666',
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recentContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
}); 