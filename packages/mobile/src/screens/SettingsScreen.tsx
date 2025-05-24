import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettings } from '@smart-accounting/shared/hooks/useSettings';

export const SettingsScreen = () => {
  const {
    loading,
    error,
    settings,
    updateSettings,
    refetch
  } = useSettings();

  const [formData, setFormData] = useState({
    businessName: settings?.businessName || '',
    currency: settings?.currency || 'USD',
    taxRate: settings?.taxRate?.toString() || '0',
    notifications: settings?.notifications || false,
    darkMode: settings?.darkMode || false
  });

  const handleSave = async () => {
    try {
      await updateSettings({
        ...formData,
        taxRate: parseFloat(formData.taxRate)
      });
      Alert.alert('Success', 'Settings updated successfully');
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    value: any,
    type: 'text' | 'switch' | 'number' = 'text',
    onChange: (value: any) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <MaterialIcons name={icon as any} size={24} color="#4F81BD" />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={value ? '#4F81BD' : '#f4f3f4'}
        />
      ) : (
        <TextInput
          style={styles.settingInput}
          value={value.toString()}
          onChangeText={onChange}
          keyboardType={type === 'number' ? 'numeric' : 'default'}
          placeholder={`Enter ${title.toLowerCase()}`}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          {renderSettingItem(
            'business',
            'Business Name',
            formData.businessName,
            'text',
            (value) => setFormData({ ...formData, businessName: value })
          )}
          {renderSettingItem(
            'attach-money',
            'Currency',
            formData.currency,
            'text',
            (value) => setFormData({ ...formData, currency: value })
          )}
          {renderSettingItem(
            'percent',
            'Tax Rate',
            formData.taxRate,
            'number',
            (value) => setFormData({ ...formData, taxRate: value })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          {renderSettingItem(
            'notifications',
            'Enable Notifications',
            formData.notifications,
            'switch',
            (value) => setFormData({ ...formData, notifications: value })
          )}
          {renderSettingItem(
            'brightness-6',
            'Dark Mode',
            formData.darkMode,
            'switch',
            (value) => setFormData({ ...formData, darkMode: value })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutItem}>
            <MaterialIcons name="info" size={24} color="#4F81BD" />
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>Smart Accounting App</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
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
  saveButton: {
    backgroundColor: '#4F81BD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold'
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15
  },
  settingInput: {
    flex: 1,
    marginLeft: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    fontSize: 16
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15
  },
  aboutInfo: {
    marginLeft: 15
  },
  aboutTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  }
}); 