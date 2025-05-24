import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { formatCurrency, formatDate } from '@smart-accounting/shared/utils/format';
import DateRangePicker from '../../components/DateRangePicker';
import ExportButton from '../../components/ExportButton';
import { FuelSale, Expense } from '@smart-accounting/shared/types';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sales
      const salesQuery = query(
        collection(db, 'fuelSales'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const salesSnapshot = await getDocs(salesQuery);
      const salesData = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FuelSale));
      setSales(salesData);

      // Fetch expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalSales - totalExpenses;

    return {
      totalSales,
      totalExpenses,
      netIncome,
    };
  };

  const { totalSales, totalExpenses, netIncome } = calculateTotals();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Reports</Text>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Income</Text>
          <Text style={[styles.summaryValue, { color: netIncome >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatCurrency(netIncome)}
          </Text>
        </View>
      </View>

      <View style={styles.exportContainer}>
        <ExportButton
          type="fuelSales"
          startDate={startDate}
          endDate={endDate}
          style={styles.exportButton}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>
        {sales.slice(0, 5).map(sale => (
          <View key={sale.id} style={styles.item}>
            <View>
              <Text style={styles.itemTitle}>{sale.fuelType}</Text>
              <Text style={styles.itemSubtitle}>{formatDate(sale.date)}</Text>
            </View>
            <Text style={styles.itemAmount}>{formatCurrency(sale.totalAmount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {expenses.slice(0, 5).map(expense => (
          <View key={expense.id} style={styles.item}>
            <View>
              <Text style={styles.itemTitle}>{expense.description}</Text>
              <Text style={styles.itemSubtitle}>{formatDate(expense.date)}</Text>
            </View>
            <Text style={[styles.itemAmount, { color: '#F44336' }]}>
              {formatCurrency(expense.amount)}
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
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  exportContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  exportButton: {
    width: '100%',
  },
  section: {
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
}); 