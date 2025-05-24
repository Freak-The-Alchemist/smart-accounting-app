import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons, List } from 'react-native-paper';
import { collection, addDoc, Timestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@smart-accounting/shared/firebase';
import { useAuth } from '../hooks/useAuth';
import { exportFuelSales } from '../utils/excelExport';
import { FuelSale } from '@smart-accounting/shared/types/petrolStation';
import { FUEL_TYPES, PAYMENT_METHODS } from '@smart-accounting/shared/constants';
import { theme } from '@smart-accounting/shared/theme';

export default function FuelSaleForm() {
  const { user } = useAuth();
  const [litersSold, setLitersSold] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [fuelType, setFuelType] = useState<typeof FUEL_TYPES[number]>(FUEL_TYPES[0]);
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>(PAYMENT_METHODS[0]);
  const [pumpId, setPumpId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<FuelSale[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'fuelSales'),
      where('attendantId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelSale[];
      setSales(salesData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to record sales');
      return;
    }

    const liters = parseFloat(litersSold);
    const price = parseFloat(pricePerLiter);

    if (isNaN(liters) || isNaN(price)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (liters <= 0 || price <= 0) {
      Alert.alert('Error', 'Values must be greater than 0');
      return;
    }

    const totalAmount = liters * price;

    setLoading(true);
    try {
      await addDoc(collection(db, 'fuelSales'), {
        date: Timestamp.now().toDate().toISOString(),
        pumpId,
        fuelType,
        litersSold: liters,
        pricePerLiter: price,
        totalAmount,
        paymentMethod,
        attendantId: user.uid
      });

      Alert.alert('Success', 'Fuel sale recorded successfully');
      // Reset form
      setLitersSold('');
      setPricePerLiter('');
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (sales.length === 0) {
      Alert.alert('Info', 'No sales to export');
      return;
    }

    setExporting(true);
    try {
      await exportFuelSales(sales);
      Alert.alert('Success', 'Sales exported successfully');
    } catch (error) {
      console.error('Error exporting sales:', error);
      Alert.alert('Error', 'Failed to export sales. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Record Fuel Sale</Text>

          <Text variant="bodyMedium" style={styles.label}>Fuel Type</Text>
          <SegmentedButtons
            value={fuelType}
            onValueChange={value => setFuelType(value as typeof FUEL_TYPES[number])}
            buttons={FUEL_TYPES.map(type => ({
              value: type,
              label: type
            }))}
            style={styles.segmentedButtons}
            theme={{ colors: { secondaryContainer: theme.colors.fuelAccent } }}
          />

          <Text variant="bodyMedium" style={styles.label}>Pump ID</Text>
          <TextInput
            value={pumpId}
            onChangeText={setPumpId}
            style={styles.input}
            keyboardType="number-pad"
            mode="outlined"
            theme={{ colors: { primary: theme.colors.fuelPrimary } }}
          />

          <Text variant="bodyMedium" style={styles.label}>Liters Sold</Text>
          <TextInput
            value={litersSold}
            onChangeText={setLitersSold}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Enter liters"
            mode="outlined"
            theme={{ colors: { primary: theme.colors.fuelPrimary } }}
          />

          <Text variant="bodyMedium" style={styles.label}>Price per Liter (KES)</Text>
          <TextInput
            value={pricePerLiter}
            onChangeText={setPricePerLiter}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Enter price"
            mode="outlined"
            left={<TextInput.Affix text="KES " />}
            theme={{ colors: { primary: theme.colors.fuelPrimary } }}
          />

          <Text variant="bodyMedium" style={styles.label}>Payment Method</Text>
          <SegmentedButtons
            value={paymentMethod}
            onValueChange={value => setPaymentMethod(value as typeof PAYMENT_METHODS[number])}
            buttons={PAYMENT_METHODS.map(method => ({
              value: method,
              label: method
            }))}
            style={styles.segmentedButtons}
            theme={{ colors: { secondaryContainer: theme.colors.fuelAccent } }}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor={theme.colors.fuelPrimary}
          >
            Record Sale
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Sales</Text>
            <Button
              mode="outlined"
              onPress={handleExport}
              loading={exporting}
              disabled={exporting || sales.length === 0}
              icon="file-excel"
              textColor={theme.colors.fuelPrimary}
              style={styles.exportButton}
            >
              Export
            </Button>
          </View>

          {sales.length > 0 ? (
            sales.slice(-5).map((sale) => (
              <List.Item
                key={sale.id}
                title={`${sale.fuelType} - Pump ${sale.pumpId}`}
                description={`${new Date(sale.date).toLocaleDateString()} - ${sale.litersSold}L @ KES ${sale.pricePerLiter} (${sale.paymentMethod})`}
                right={() => (
                  <Text variant="bodyLarge" style={styles.amount}>
                    KES {sale.totalAmount.toFixed(2)}
                  </Text>
                )}
                left={props => <List.Icon {...props} icon="gas-station" color={theme.colors.fuelPrimary} />}
                style={styles.listItem}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={styles.noSales}>No sales recorded yet</Text>
          )}
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.text,
    ...theme.typography.mobile.h2,
  },
  noSales: {
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
  },
  exportButton: {
    borderColor: theme.colors.fuelPrimary,
  },
  listItem: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  amount: {
    color: theme.colors.fuelPrimary,
    fontWeight: '600',
  },
}); 