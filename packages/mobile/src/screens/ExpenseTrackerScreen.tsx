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
import { useExpenses } from '@smart-accounting/shared/hooks/useExpenses';
import { Expense } from '@smart-accounting/shared/types';

export const ExpenseTrackerScreen = () => {
  const {
    loading,
    error,
    expenses,
    createExpense,
    refetch
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    paymentMethod: 'cash'
  });

  const handleSubmit = async () => {
    if (!formData.description || !formData.amount || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
        timestamp: new Date().toISOString()
      });

      setFormData({
        description: '',
        amount: '',
        category: '',
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
      <Text style={styles.formTitle}>New Expense</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Enter expense description"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={formData.amount}
          onChangeText={(text) => setFormData({ ...formData, amount: text })}
          keyboardType="numeric"
          placeholder="Enter amount"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          {['Fuel', 'Maintenance', 'Utilities', 'Supplies', 'Other'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.pickerOption,
                formData.category === category && styles.pickerOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, category })}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.category === category && styles.pickerOptionTextSelected
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.pickerContainer}>
          {['cash', 'card', 'bank'].map((method) => (
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

  const renderExpenseItem = (expense: Expense) => (
    <View key={expense.id} style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseCategory}>{expense.category}</Text>
        </View>
        <Text style={styles.expenseAmount}>${expense.amount}</Text>
      </View>
      <View style={styles.expenseFooter}>
        <View style={styles.paymentMethod}>
          <MaterialIcons
            name={
              expense.paymentMethod === 'cash'
                ? 'payments'
                : expense.paymentMethod === 'card'
                ? 'credit-card'
                : 'account-balance'
            }
            size={16}
            color="#666"
          />
          <Text style={styles.paymentMethodText}>
            {expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(expense.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
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

      <ScrollView style={styles.expensesList}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F81BD" />
        ) : (
          expenses?.map(renderExpenseItem)
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
  expensesList: {
    flex: 1,
    padding: 20
  },
  expenseItem: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  expenseInfo: {
    flex: 1
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336'
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  timestamp: {
    fontSize: 12,
    color: '#999'
  }
}); 