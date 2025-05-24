import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAccounting } from '@smart-accounting/shared/hooks/useAccounting';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { OCRVoiceInput } from '../components/OCRVoiceInput';

const screenWidth = Dimensions.get('window').width;

export const AccountingScreen = () => {
  const {
    loading,
    error,
    financialData,
    salesData,
    expensesData,
    refetch
  } = useAccounting();

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [transactionForm, setTransactionForm] = useState({
    amount: 0,
    date: new Date(),
    description: '',
  });

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonSelected
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextSelected
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFinancialOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Overview</Text>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewItem}>
          <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.overviewValue}>
            ${financialData?.totalRevenue || 0}
          </Text>
          <Text style={styles.overviewLabel}>Total Revenue</Text>
        </View>
        <View style={styles.overviewItem}>
          <MaterialIcons name="trending-down" size={24} color="#F44336" />
          <Text style={styles.overviewValue}>
            ${financialData?.totalExpenses || 0}
          </Text>
          <Text style={styles.overviewLabel}>Total Expenses</Text>
        </View>
        <View style={styles.overviewItem}>
          <MaterialIcons name="account-balance" size={24} color="#2196F3" />
          <Text style={styles.overviewValue}>
            ${financialData?.netProfit || 0}
          </Text>
          <Text style={styles.overviewLabel}>Net Profit</Text>
        </View>
        <View style={styles.overviewItem}>
          <MaterialIcons name="percent" size={24} color="#FF9800" />
          <Text style={styles.overviewValue}>
            {financialData?.profitMargin || 0}%
          </Text>
          <Text style={styles.overviewLabel}>Profit Margin</Text>
        </View>
      </View>
    </View>
  );

  const renderSalesChart = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sales Trend</Text>
      <LineChart
        data={{
          labels: salesData?.labels || [],
          datasets: [
            {
              data: salesData?.values || []
            }
          ]
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(79, 129, 189, ${opacity})`,
          style: {
            borderRadius: 16
          }
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );

  const renderExpensesBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Expenses Breakdown</Text>
      {expensesData?.map((expense) => (
        <View key={expense.category} style={styles.expenseItem}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseCategory}>{expense.category}</Text>
            <Text style={styles.expensePercentage}>{expense.percentage}%</Text>
          </View>
          <View style={styles.expenseBarContainer}>
            <View
              style={[
                styles.expenseBar,
                { width: `${expense.percentage}%` }
              ]}
            />
          </View>
          <Text style={styles.expenseAmount}>${expense.amount}</Text>
        </View>
      ))}
    </View>
  );

  const handleTransactionDataExtracted = (data: {
    amount: number;
    date: Date;
    vendor: string;
    items: string[];
  }) => {
    // Pre-fill the transaction form with extracted data
    setTransactionForm({
      ...transactionForm,
      amount: data.amount,
      date: data.date,
      description: `${data.vendor} - ${data.items.join(', ')}`,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounting</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
          <MaterialIcons name="refresh" size={24} color="#4F81BD" />
        </TouchableOpacity>
      </View>

      <OCRVoiceInput onTransactionDataExtracted={handleTransactionDataExtracted} />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {renderPeriodSelector()}
        {loading ? (
          <ActivityIndicator size="large" color="#4F81BD" />
        ) : (
          <>
            {renderFinancialOverview()}
            {renderSalesChart()}
            {renderExpensesBreakdown()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  refreshButton: {
    padding: 8
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center'
  },
  content: {
    flex: 1
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10
  },
  periodButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5'
  },
  periodButtonSelected: {
    backgroundColor: '#4F81BD'
  },
  periodButtonText: {
    color: '#666',
    fontWeight: '500'
  },
  periodButtonTextSelected: {
    color: '#fff'
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  overviewItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center'
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  expenseItem: {
    marginBottom: 15
  },
  expenseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  expenseCategory: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  expensePercentage: {
    fontSize: 14,
    color: '#666'
  },
  expenseBarContainer: {
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden'
  },
  expenseBar: {
    height: '100%',
    backgroundColor: '#4F81BD',
    borderRadius: 4
  },
  expenseAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right'
  }
}); 