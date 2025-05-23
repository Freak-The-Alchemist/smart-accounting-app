import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Surface,
  Card,
  List,
  SegmentedButtons,
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog
} from 'react-native-paper';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import { LoadingSkeleton } from '@smart-accounting/shared/components/LoadingSkeleton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getShiftsByDateRange,
  getFuelSalesByDateRange,
  getExpensesByDateRange,
  exportToExcel
} from '@smart-accounting/shared/services/firebase';
import { FinancialReports, calculateFinancialMetrics } from '@smart-accounting/shared/components/FinancialReports';
import type { Shift, FuelSale, Expense } from '@smart-accounting/shared/types/petrolStation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export const DetailedReportsScreen = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState('sales');
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsData, salesData, expensesData] = await Promise.all([
        getShiftsByDateRange(startDate, endDate),
        getFuelSalesByDateRange(startDate, endDate),
        getExpensesByDateRange(startDate, endDate)
      ]);
      setShifts(shiftsData);
      setSales(salesData);
      setExpenses(expensesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportToExcel({
        startDate,
        endDate,
        shifts,
        sales,
        expenses
      });
      Alert.alert('Success', 'Data exported successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const metrics = calculateFinancialMetrics(sales, expenses);

  const handleDateChange = (event: any, selectedDate: Date | undefined, isStartDate: boolean) => {
    if (selectedDate) {
      if (isStartDate) {
        setStartDate(selectedDate);
        setShowStartDatePicker(false);
      } else {
        setEndDate(selectedDate);
        setShowEndDatePicker(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const renderSalesTrend = () => {
    const data = Object.entries(metrics.dailyTotals).map(([date, amount]) => ({
      date,
      amount
    }));

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sales Trend
          </Text>
          <LineChart
            data={{
              labels: data.map(item => item.date),
              datasets: [{
                data: data.map(item => item.amount)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderSalesByFuelType = () => {
    const data = Object.entries(metrics.salesByFuelType).map(([type, amount]) => ({
      name: type,
      value: amount
    }));

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sales by Fuel Type
          </Text>
          <PieChart
            data={data.map((item, index) => ({
              name: item.name,
              value: item.value,
              color: theme.colors.primary,
              legendFontColor: theme.colors.onSurface,
              legendFontSize: 12
            }))}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => theme.colors.primary
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderPaymentMethods = () => {
    const data = Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => ({
      name: method,
      value: amount
    }));

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sales by Payment Method
          </Text>
          <BarChart
            data={{
              labels: data.map(item => item.name),
              datasets: [{
                data: data.map(item => item.value)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              style: {
                borderRadius: 16
              }
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderExpensesBreakdown = () => {
    const data = Object.entries(metrics.expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Expenses by Category
          </Text>
          <PieChart
            data={data.map((item, index) => ({
              name: item.name,
              value: item.value,
              color: theme.colors.primary,
              legendFontColor: theme.colors.onSurface,
              legendFontSize: 12
            }))}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => theme.colors.primary
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    );
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
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                Date Range
              </Text>

              <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
              >
                Start Date: {formatDate(startDate)}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                End Date: {formatDate(endDate)}
              </Button>

              <Button
                mode="contained"
                onPress={handleExport}
                style={styles.exportButton}
                icon="file-excel"
              >
                Export to Excel
              </Button>
            </Card.Content>
          </Card>

          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'sales', label: 'Sales' },
              { value: 'expenses', label: 'Expenses' },
              { value: 'trends', label: 'Trends' }
            ]}
            style={styles.segmentedButtons}
          />

          {activeTab === 'sales' && (
            <>
              {renderSalesTrend()}
              {renderSalesByFuelType()}
              {renderPaymentMethods()}
            </>
          )}

          {activeTab === 'expenses' && (
            <>
              {renderExpensesBreakdown()}
            </>
          )}

          {activeTab === 'trends' && (
            <>
              {renderSalesTrend()}
            </>
          )}
        </Surface>
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, true)}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, false)}
        />
      )}
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
  dateButton: {
    marginBottom: 8,
  },
  exportButton: {
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 