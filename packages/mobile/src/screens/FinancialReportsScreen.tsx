import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AccountingEntry } from '@smart-accounting/shared/types/accounting';
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlowStatement,
} from '@smart-accounting/shared/services/financialReporting';
import { formatCurrency } from '@smart-accounting/shared/services/inputProcessing';

type ReportType = 'balance_sheet' | 'income_statement' | 'cash_flow';

export default function FinancialReportsScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('balance_sheet');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [report, setReport] = useState<any>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (!user) return;

    const entriesRef = collection(db, 'accounting_entries');
    const q = query(
      entriesRef,
      where('createdBy', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newEntries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AccountingEntry[];
        setEntries(newEntries);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const generateReport = async () => {
      if (entries.length === 0) return;

      try {
        let newReport;
        switch (reportType) {
          case 'balance_sheet':
            newReport = await generateBalanceSheet(entries, startDate, endDate);
            break;
          case 'income_statement':
            newReport = await generateIncomeStatement(entries, startDate, endDate);
            break;
          case 'cash_flow':
            newReport = await generateCashFlowStatement(entries, startDate, endDate);
            break;
        }
        setReport(newReport);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    generateReport();
  }, [entries, reportType, startDate, endDate]);

  const renderBalanceSheet = () => {
    if (!report) return null;

    return (
      <ScrollView style={styles.table}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assets</Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Current Assets</Text>
            <Text style={styles.total}>
              {formatCurrency(
                Object.values(report.assets.current).reduce((a: number, b: number) => a + b, 0)
              )}
            </Text>
            {Object.entries(report.assets.current).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={styles.value}>{formatCurrency(value as number)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Fixed Assets</Text>
            <Text style={styles.total}>
              {formatCurrency(
                Object.values(report.assets.fixed).reduce((a: number, b: number) => a + b, 0)
              )}
            </Text>
            {Object.entries(report.assets.fixed).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={styles.value}>{formatCurrency(value as number)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liabilities</Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Current Liabilities</Text>
            <Text style={styles.total}>
              {formatCurrency(
                Object.values(report.liabilities.current).reduce((a: number, b: number) => a + b, 0)
              )}
            </Text>
            {Object.entries(report.liabilities.current).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={styles.value}>{formatCurrency(value as number)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Long-term Liabilities</Text>
            <Text style={styles.total}>
              {formatCurrency(
                Object.values(report.liabilities.longTerm).reduce((a: number, b: number) => a + b, 0)
              )}
            </Text>
            {Object.entries(report.liabilities.longTerm).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                <Text style={styles.value}>{formatCurrency(value as number)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equity</Text>
          {Object.entries(report.equity).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderIncomeStatement = () => {
    if (!report) return null;

    return (
      <ScrollView style={styles.table}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          {Object.entries(report.revenue).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Cost of Goods Sold</Text>
            <Text style={styles.value}>{formatCurrency(report.costOfGoodsSold)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Profit</Text>
            <Text style={styles.value}>{formatCurrency(report.grossProfit)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Expenses</Text>
          {Object.entries(report.operatingExpenses).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Operating Income</Text>
            <Text style={styles.value}>{formatCurrency(report.operatingIncome)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Other Income</Text>
            <Text style={styles.value}>{formatCurrency(report.otherIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Other Expenses</Text>
            <Text style={styles.value}>{formatCurrency(report.otherExpenses)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Net Income</Text>
            <Text style={styles.totalValue}>{formatCurrency(report.netIncome)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCashFlowStatement = () => {
    if (!report) return null;

    return (
      <ScrollView style={styles.table}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Activities</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Net Income</Text>
            <Text style={styles.value}>{formatCurrency(report.operating.netIncome)}</Text>
          </View>
          <Text style={styles.subsectionTitle}>Adjustments</Text>
          {Object.entries(report.operating.adjustments).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.label}>Net Cash from Operations</Text>
            <Text style={styles.value}>{formatCurrency(report.operating.netCashFromOperations)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investing Activities</Text>
          {Object.entries(report.investing).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financing Activities</Text>
          {Object.entries(report.financing).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={styles.value}>{formatCurrency(value as number)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Net Change in Cash</Text>
            <Text style={styles.value}>{formatCurrency(report.netChangeInCash)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Beginning Cash</Text>
            <Text style={styles.value}>{formatCurrency(report.beginningCash)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Ending Cash</Text>
            <Text style={styles.totalValue}>{formatCurrency(report.endingCash)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Reports</Text>
        <View style={styles.controls}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
              style={styles.picker}
            >
              <Picker.Item label="Balance Sheet" value="balance_sheet" />
              <Picker.Item label="Income Statement" value="income_statement" />
              <Picker.Item label="Cash Flow" value="cash_flow" />
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>Start: {startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>End: {endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {(showStartDatePicker || showEndDatePicker) && (
            <DateTimePicker
              value={showStartDatePicker ? startDate : endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  if (showStartDatePicker) {
                    setStartDate(selectedDate);
                  } else {
                    setEndDate(selectedDate);
                  }
                }
                setShowStartDatePicker(false);
                setShowEndDatePicker(false);
              }}
            />
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {reportType === 'balance_sheet' && renderBalanceSheet()}
          {reportType === 'income_statement' && renderIncomeStatement()}
          {reportType === 'cash_flow' && renderCashFlowStatement()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  picker: {
    height: 40,
  },
  dateButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    minWidth: 120,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    margin: 16,
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  table: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  totalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 