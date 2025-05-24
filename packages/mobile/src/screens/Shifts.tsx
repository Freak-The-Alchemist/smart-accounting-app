import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '@smart-accounting/shared/firebase';
import { formatDate } from '@smart-accounting/shared/utils/format';
import { Shift } from '@smart-accounting/shared/types';

export default function Shifts() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  const fetchShifts = async () => {
    try {
      const shiftsQuery = query(
        collection(db, 'shifts'),
        orderBy('startTime', 'desc')
      );
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shiftsData = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      setShifts(shiftsData);

      // Find active shift
      const active = shiftsData.find(shift => !shift.endTime);
      setActiveShift(active || null);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      Alert.alert('Error', 'Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleStartShift = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to start a shift');
        return;
      }

      const newShift: Omit<Shift, 'id'> = {
        attendantId: user.uid,
        attendantName: user.displayName || user.email || 'Unknown',
        startTime: new Date(),
        endTime: null,
        totalSales: 0,
        totalExpenses: 0,
      };

      await addDoc(collection(db, 'shifts'), newShift);
      await fetchShifts();
      Alert.alert('Success', 'Shift started successfully');
    } catch (error) {
      console.error('Error starting shift:', error);
      Alert.alert('Error', 'Failed to start shift');
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    try {
      const shiftRef = doc(db, 'shifts', activeShift.id);
      await updateDoc(shiftRef, {
        endTime: new Date(),
      });
      await fetchShifts();
      Alert.alert('Success', 'Shift ended successfully');
    } catch (error) {
      console.error('Error ending shift:', error);
      Alert.alert('Error', 'Failed to end shift');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shifts</Text>
        {!activeShift ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartShift}>
            <Text style={styles.buttonText}>Start Shift</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.endButton} onPress={handleEndShift}>
            <Text style={styles.buttonText}>End Shift</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.shiftsList}>
        {shifts.map(shift => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.attendantName}>{shift.attendantName}</Text>
              <Text style={styles.shiftStatus}>
                {shift.endTime ? 'Completed' : 'Active'}
              </Text>
            </View>
            <View style={styles.shiftDetails}>
              <Text style={styles.detailLabel}>Start Time</Text>
              <Text style={styles.detailValue}>{formatDate(shift.startTime)}</Text>
              {shift.endTime && (
                <>
                  <Text style={styles.detailLabel}>End Time</Text>
                  <Text style={styles.detailValue}>{formatDate(shift.endTime)}</Text>
                </>
              )}
              <Text style={styles.detailLabel}>Total Sales</Text>
              <Text style={styles.detailValue}>{shift.totalSales.toFixed(2)} KES</Text>
              <Text style={styles.detailLabel}>Total Expenses</Text>
              <Text style={styles.detailValue}>{shift.totalExpenses.toFixed(2)} KES</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  endButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  shiftsList: {
    flex: 1,
    padding: 16,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  attendantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shiftStatus: {
    fontSize: 14,
    color: '#666',
  },
  shiftDetails: {
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
}); 