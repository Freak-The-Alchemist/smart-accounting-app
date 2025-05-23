import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, List, Divider, Chip } from 'react-native-paper';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { useAuth } from '../hooks/useAuth';
import { exportExpenses, exportFuelSales, exportShifts } from '../utils/excelExport';
import { Expense, FuelSale, Shift } from '@smart-accounting/shared/types/petrolStation';
import { theme, spacing } from '@smart-accounting/shared/theme';

type ExportType = 'expenses' | 'fuelSales' | 'shifts';
type DateRange = 'today' | 'week' | 'month' | 'all';

export default function ExportScreen() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [exporting, setExporting] = useState<ExportType | null>(null);

  const getDateRange = (range: DateRange) => {
    const now = new Date();
    switch (range) {
      case 'today':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: now
        };
      case 'week':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          end: now
        };
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          end: now
        };
      default:
        return {
          start: new Date(0),
          end: now
        };
    }
  };

  const loadAndExport = async (type: ExportType) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to export data');
      return;
    }

    setExporting(type);
    try {
      const { start, end } = getDateRange(dateRange);
      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      let data: any[] = [];
      let q;

      switch (type) {
        case 'expenses':
          q = query(
            collection(db, 'expenses'),
            where('attendantId', '==', user.uid),
            where('date', '>=', start.toISOString()),
            where('date', '<=', end.toISOString())
          );
          const expensesSnapshot = await getDocs(q);
          data = expensesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Expense[];
          await exportExpenses(data);
          break;

        case 'fuelSales':
          q = query(
            collection(db, 'fuelSales'),
            where('attendantId', '==', user.uid),
            where('date', '>=', start.toISOString()),
            where('date', '<=', end.toISOString())
          );
          const salesSnapshot = await getDocs(q);
          data = salesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FuelSale[];
          await exportFuelSales(data);
          break;

        case 'shifts':
          q = query(
            collection(db, 'shifts'),
            where('attendantId', '==', user.uid),
            where('startTime', '>=', start.toISOString()),
            where('startTime', '<=', end.toISOString())
          );
          const shiftsSnapshot = await getDocs(q);
          data = shiftsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Shift[];
          await exportShifts(data);
          break;
      }

      Alert.alert('Success', `${type} exported successfully`);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      Alert.alert('Error', `Failed to export ${type}. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Export Data</Text>

          <Text variant="bodyMedium" style={styles.label}>Date Range</Text>
          <View style={styles.chipContainer}>
            <Chip
              selected={dateRange === 'today'}
              onPress={() => setDateRange('today')}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              Today
            </Chip>
            <Chip
              selected={dateRange === 'week'}
              onPress={() => setDateRange('week')}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              Last 7 Days
            </Chip>
            <Chip
              selected={dateRange === 'month'}
              onPress={() => setDateRange('month')}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              Last 30 Days
            </Chip>
            <Chip
              selected={dateRange === 'all'}
              onPress={() => setDateRange('all')}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              All Time
            </Chip>
          </View>

          <List.Section>
            <List.Subheader>Export Options</List.Subheader>
            <List.Item
              title="Export Expenses"
              description="Export all recorded expenses"
              left={props => <List.Icon {...props} icon="cash" color={theme.colors.primary} />}
              right={props => (
                <Button
                  mode="outlined"
                  onPress={() => loadAndExport('expenses')}
                  loading={exporting === 'expenses'}
                  disabled={!!exporting}
                  style={styles.exportButton}
                  textColor={theme.colors.primary}
                >
                  Export
                </Button>
              )}
            />
            <Divider />
            <List.Item
              title="Export Fuel Sales"
              description="Export all fuel sales records"
              left={props => <List.Icon {...props} icon="gas-station" color={theme.colors.fuelPrimary} />}
              right={props => (
                <Button
                  mode="outlined"
                  onPress={() => loadAndExport('fuelSales')}
                  loading={exporting === 'fuelSales'}
                  disabled={!!exporting}
                  style={styles.exportButton}
                  textColor={theme.colors.fuelPrimary}
                >
                  Export
                </Button>
              )}
            />
            <Divider />
            <List.Item
              title="Export Shifts"
              description="Export all shift records"
              left={props => <List.Icon {...props} icon="clock-outline" color={theme.colors.secondary} />}
              right={props => (
                <Button
                  mode="outlined"
                  onPress={() => loadAndExport('shifts')}
                  loading={exporting === 'shifts'}
                  disabled={!!exporting}
                  style={styles.exportButton}
                  textColor={theme.colors.secondary}
                >
                  Export
                </Button>
              )}
            />
          </List.Section>
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
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  chip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
  },
  exportButton: {
    borderColor: theme.colors.primary,
  },
}); 