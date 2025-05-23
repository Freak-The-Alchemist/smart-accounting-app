import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { exportFuelSales, exportShiftReport, exportDailyReport } from '../services/exportService';

interface ExportButtonProps {
  type: 'fuelSales' | 'shift' | 'daily';
  startDate?: Date;
  endDate?: Date;
  shiftId?: string;
  date?: Date;
  style?: any;
}

export default function ExportButton({ type, startDate, endDate, shiftId, date, style }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      switch (type) {
        case 'fuelSales':
          if (!startDate || !endDate) {
            throw new Error('Start date and end date are required for fuel sales export');
          }
          await exportFuelSales(startDate, endDate);
          break;
        case 'shift':
          if (!shiftId) {
            throw new Error('Shift ID is required for shift report export');
          }
          await exportShiftReport(shiftId);
          break;
        case 'daily':
          if (!date) {
            throw new Error('Date is required for daily report export');
          }
          await exportDailyReport(date);
          break;
      }
      Alert.alert('Success', 'Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleExport}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Export to Excel</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 