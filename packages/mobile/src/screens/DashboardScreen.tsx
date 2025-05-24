import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, List, ActivityIndicator, IconButton, Button, Menu, Divider, Chip } from 'react-native-paper';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '@smart-accounting/shared/hooks/useUserRole';
import { theme } from '@smart-accounting/shared/theme';
import { FuelSale, Shift, Expense, StockItem } from '@smart-accounting/shared/types/petrolStation';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { exportToExcelMobile } from '../utils/excelExport';
import { useTheme } from 'react-native-paper';
import {
  getFuelSales,
  getExpenses,
  getLowStockItems,
} from '@smart-accounting/shared/services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useDashboard } from '@smart-accounting/shared/hooks/useDashboard';

const { width } = Dimensions.get('window');

type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function DashboardScreen() {
  const { user } = useAuth();
  const role = useUserRole();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [menuVisible, setMenuVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const {
    stats,
    recentTransactions,
    alerts,
    refetch
  } = useDashboard();

  useEffect(() => {
    if (!user) return;

    const getDateRange = () => {
      const now = new Date();
      const start = new Date();
      
      switch (dateRange) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        default: // today
          start.setHours(0, 0, 0, 0);
      }
      
      return start.toISOString();
    };

    const startDate = getDateRange();

    // Query for sales
    const salesQuery = query(
      collection(db, 'fuelSales'),
      where('date', '>=', startDate),
      orderBy('date', 'desc')
    );

    // Query for shifts
    const shiftsQuery = query(
      collection(db, 'shifts'),
      where('startTime', '>=', startDate),
      orderBy('startTime', 'desc')
    );

    // Query for expenses
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', startDate),
      orderBy('date', 'desc')
    );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelSale[];
      setSales(salesData);
      setLoading(false);
    });

    const unsubShifts = onSnapshot(shiftsQuery, (snapshot) => {
      const shiftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(shiftsData);
      
      const active = shiftsData.find(shift => !shift.endTime);
      setActiveShift(active || null);
    });

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expensesData);
    });

    return () => {
      unsubSales();
      unsubShifts();
      unsubExpenses();
    };
  }, [user, dateRange]);

  useEffect(() => {
    if (user?.stationId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.stationId) return;

    try {
      setLoading(true);
      const [sales, expenses, stock] = await Promise.all([
        getFuelSales(user.stationId),
        getExpenses(user.stationId),
        getLowStockItems(user.stationId),
      ]);

      setSales(sales);
      setExpenses(expenses);
      setStockItems(stock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  // Calculate totals
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netIncome = totalSales - totalExpenses;

  // Calculate payment method breakdown
  const cashSales = sales
    .filter(sale => sale.paymentMethod === 'Cash')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);
  const mpesaSales = sales
    .filter(sale => sale.paymentMethod === 'M-Pesa')
    .reduce((sum, sale) => sum + sale.totalAmount, 0);

  // Prepare chart data
  const salesChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0] // Will be populated with actual data
    }]
  };

  const paymentMethodData = [
    {
      name: 'Cash',
      population: cashSales,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
    },
    {
      name: 'M-Pesa',
      population: mpesaSales,
      color: theme.colors.secondary,
      legendFontColor: theme.colors.text,
    }
  ];

  const handleExport = async () => {
    if (sales.length === 0) {
      Alert.alert('Info', 'No data to export');
      return;
    }

    setExporting(true);
    try {
      await exportToExcelMobile(sales, {
        filename: `sales-report-${dateRange}`,
        sheetName: 'Sales Report'
      });
      Alert.alert('Success', 'Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const calculateTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.totalAmount, 0);
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getSalesByFuelType = () => {
    const salesByType = sales.reduce((acc, sale) => {
      acc[sale.fuelType] = (acc[sale.fuelType] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(salesByType),
      datasets: [
        {
          data: Object.values(salesByType),
        },
      ],
    };
  };

  const getSalesByHour = () => {
    const salesByHour = sales.reduce((acc, sale) => {
      const hour = sale.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + sale.totalAmount;
      return acc;
    }, {} as Record<number, number>);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString());
    const amounts = hours.map((hour) => salesByHour[parseInt(hour)] || 0);

    return {
      labels: hours,
      datasets: [
        {
          data: amounts,
        },
      ],
    };
  };

  const renderAttendantDashboard = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="local-gas-station" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>{stats?.todaySales || 0}</Text>
          <Text style={styles.statLabel}>Today's Sales</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="schedule" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>{stats?.shiftHours || 0}</Text>
          <Text style={styles.statLabel}>Shift Hours</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions?.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>{transaction.type}</Text>
              <Text style={styles.transactionTime}>{transaction.time}</Text>
            </View>
            <Text style={styles.transactionAmount}>${transaction.amount}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderAccountantDashboard = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="account-balance" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>${stats?.monthlyRevenue || 0}</Text>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>{stats?.profitMargin || 0}%</Text>
          <Text style={styles.statLabel}>Profit Margin</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.financialCard}>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Total Sales</Text>
            <Text style={styles.financialValue}>${stats?.totalSales || 0}</Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Total Expenses</Text>
            <Text style={styles.financialValue}>${stats?.totalExpenses || 0}</Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Net Profit</Text>
            <Text style={styles.financialValue}>${stats?.netProfit || 0}</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderManagerDashboard = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="security" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>{alerts?.length || 0}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="people" size={24} color="#4F81BD" />
          <Text style={styles.statValue}>{stats?.activeStaff || 0}</Text>
          <Text style={styles.statLabel}>Active Staff</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {alerts?.map((alert) => (
          <View key={alert.id} style={styles.alertItem}>
            <MaterialIcons
              name={alert.severity === 'high' ? 'error' : 'warning'}
              size={24}
              color={alert.severity === 'high' ? '#FF4444' : '#FFBB33'}
            />
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDescription}>{alert.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Fuel Efficiency</Text>
            <Text style={styles.metricValue}>{stats?.fuelEfficiency || 0}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Customer Satisfaction</Text>
            <Text style={styles.metricValue}>{stats?.customerSatisfaction || 0}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Staff Productivity</Text>
            <Text style={styles.metricValue}>{stats?.staffProductivity || 0}%</Text>
          </View>
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.displayName || 'User'}!
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {user?.role === 'attendant' && renderAttendantDashboard()}
      {user?.role === 'accountant' && renderAccountantDashboard()}
      {user?.role === 'manager' && renderManagerDashboard()}

      {/* Date Range Selector */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Date Range</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  icon="calendar"
                >
                  {dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setDateRange('today'); setMenuVisible(false); }} title="Today" />
              <Menu.Item onPress={() => { setDateRange('week'); setMenuVisible(false); }} title="Last 7 Days" />
              <Menu.Item onPress={() => { setDateRange('month'); setMenuVisible(false); }} title="Last 30 Days" />
            </Menu>
          </View>
        </Card.Content>
      </Card>

      {/* Shift Status Card - Only visible to attendants */}
      {role === 'attendant' && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Current Shift</Text>
              <IconButton
                icon={activeShift ? 'clock-check' : 'clock-outline'}
                size={24}
                iconColor={activeShift ? theme.colors.success : theme.colors.textSecondary}
              />
            </View>
            
            {activeShift ? (
              <>
                <Text variant="bodyLarge" style={styles.shiftTime}>
                  Started at {new Date(activeShift.startTime).toLocaleTimeString()}
                </Text>
                <Text variant="bodyMedium" style={styles.shiftDuration}>
                  Duration: {calculateDuration(activeShift.startTime)}
                </Text>
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.noShift}>
                No active shift
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Financial Overview Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Financial Overview</Text>
            <Button
              mode="outlined"
              onPress={handleExport}
              loading={exporting}
              disabled={exporting || sales.length === 0}
              icon="file-excel"
            >
              Export
            </Button>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Total Sales</Text>
              <Text variant="titleLarge" style={styles.statValue}>
                KES {totalSales.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Expenses</Text>
              <Text variant="titleLarge" style={[styles.statValue, styles.expenseValue]}>
                KES {totalExpenses.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Net Income</Text>
              <Text variant="titleLarge" style={[styles.statValue, netIncome >= 0 ? styles.incomeValue : styles.expenseValue]}>
                KES {netIncome.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Sales Trend Chart - Only visible to managers */}
          {role === 'manager' && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodyMedium" style={styles.chartTitle}>Sales Trend</Text>
              <LineChart
                data={salesChartData}
                width={width - 48}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.colors.primary,
                  labelColor: (opacity = 1) => theme.colors.text,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </>
          )}

          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.chartTitle}>Payment Methods</Text>
          <PieChart
            data={paymentMethodData}
            width={width - 48}
            height={220}
            chartConfig={{
              color: (opacity = 1) => theme.colors.text,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Recent Activity Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
          
          {sales.length > 0 ? (
            sales.slice(-5).map((sale) => (
              <List.Item
                key={sale.id}
                title={`${sale.fuelType} - ${sale.litersSold}L`}
                description={`KES ${sale.totalAmount.toFixed(2)} - ${sale.paymentMethod}`}
                left={props => (
                  <List.Icon 
                    {...props} 
                    icon="gas-station" 
                    color={theme.colors.primary}
                  />
                )}
                style={styles.listItem}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.noActivity}>
              No sales recorded in selected period
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Total Sales</Title>
          <Paragraph style={styles.amount}>
            ${calculateTotalSales().toFixed(2)}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Total Expenses</Title>
          <Paragraph style={styles.amount}>
            ${calculateTotalExpenses().toFixed(2)}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Sales by Fuel Type</Title>
          <BarChart
            data={getSalesByFuelType()}
            width={width - 32}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: theme.colors.background,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              labelColor: (opacity = 1) => theme.colors.onBackground,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Sales by Hour</Title>
          <LineChart
            data={getSalesByHour()}
            width={width - 32}
            height={220}
            yAxisLabel="$"
            chartConfig={{
              backgroundColor: theme.colors.background,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              labelColor: (opacity = 1) => theme.colors.onBackground,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Low Stock Items</Title>
          {stockItems.map((item) => (
            <React.Fragment key={item.id}>
              <List.Item
                title={item.name}
                description={`${item.quantity} ${item.unit}`}
                right={() => (
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
                )}
              />
              <Divider />
            </React.Fragment>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function calculateDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...theme.typography.mobile.h2,
  },
  shiftTime: {
    color: theme.colors.text,
    ...theme.typography.mobile.body1,
  },
  shiftDuration: {
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  noShift: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    ...theme.typography.mobile.body2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  statValue: {
    color: theme.colors.text,
    ...theme.typography.mobile.h3,
  },
  incomeValue: {
    color: theme.colors.success,
  },
  expenseValue: {
    color: theme.colors.error,
  },
  divider: {
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  chartTitle: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    ...theme.typography.mobile.body1,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
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
  noActivity: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  quantityChip: {
    marginTop: 8,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  section: {
    padding: 20
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  transactionInfo: {
    flex: 1
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  transactionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F81BD'
  },
  financialCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  financialLabel: {
    fontSize: 16,
    color: '#666'
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  alertInfo: {
    flex: 1,
    marginLeft: 15
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  metricsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  metricLabel: {
    fontSize: 16,
    color: '#666'
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  }
}); 