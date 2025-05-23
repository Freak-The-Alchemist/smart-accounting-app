import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFuelSales } from '@smart-accounting/shared/hooks/useFuelSales';
import { FuelSale } from '@smart-accounting/shared/types';

export const FuelSalesScreen = () => {
  const {
    loading,
    error,
    fuelSales,
    createFuelSale,
    refetch
  } = useFuelSales();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fuelType: '',
    quantity: '',
    price: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = async () => {
    if (!formData.fuelType || !formData.quantity || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createFuelSale({
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        timestamp: new Date().toISOString()
      });

      setFormData({
        fuelType: '',
        quantity: '',
        price: '',
        paymentMethod: 'cash'
      });
      setShowForm(false);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>New Fuel Sale</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fuel Type</Text>
        <View style={styles.pickerContainer}>
          {['Regular', 'Premium', 'Diesel'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                formData.fuelType === type && styles.pickerOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, fuelType: type })}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.fuelType === type && styles.pickerOptionTextSelected
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Quantity (Liters)</Text>
        <TextInput
          style={styles.input}
          value={formData.quantity}
          onChangeText={(text) => setFormData({ ...formData, quantity: text })}
          keyboardType="numeric"
          placeholder="Enter quantity"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Price per Liter</Text>
        <TextInput
          style={styles.input}
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="numeric"
          placeholder="Enter price"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.pickerContainer}>
          {['cash', 'card', 'mobile'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.pickerOption,
                formData.paymentMethod === method && styles.pickerOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, paymentMethod: method })}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.paymentMethod === method && styles.pickerOptionTextSelected
                ]}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowForm(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaleItem = (sale: FuelSale) => (
    <View key={sale.id} style={styles.saleItem}>
      <View style={styles.saleHeader}>
        <Text style={styles.fuelType}>{sale.fuelType}</Text>
        <Text style={styles.timestamp}>
          {new Date(sale.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <View style={styles.saleDetails}>
        <View style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{sale.quantity}L</Text>
        </View>
        <View style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Price/L</Text>
          <Text style={styles.detailValue}>${sale.price}</Text>
        </View>
        <View style={styles.saleDetail}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.detailValue}>
            ${(sale.quantity * sale.price).toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.paymentMethod}>
        <MaterialIcons
          name={
            sale.paymentMethod === 'cash'
              ? 'payments'
              : sale.paymentMethod === 'card'
              ? 'credit-card'
              : 'smartphone'
          }
          size={16}
          color="#666"
        />
        <Text style={styles.paymentMethodText}>
          {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Sales</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <MaterialIcons
            name={showForm ? 'close' : 'add'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showForm && renderForm()}

      <ScrollView style={styles.salesList}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F81BD" />
        ) : (
          fuelSales?.map(renderSaleItem)
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
  addButton: {
    backgroundColor: '#4F81BD',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
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
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  pickerOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  pickerOptionSelected: {
    backgroundColor: '#4F81BD',
    borderColor: '#4F81BD'
  },
  pickerOptionText: {
    color: '#666'
  },
  pickerOptionTextSelected: {
    color: '#fff'
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  submitButton: {
    backgroundColor: '#4F81BD'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  salesList: {
    flex: 1,
    padding: 20
  },
  saleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  fuelType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  timestamp: {
    fontSize: 14,
    color: '#666'
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  saleDetail: {
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  }
}); 