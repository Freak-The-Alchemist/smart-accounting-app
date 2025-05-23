import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/accountant/DashboardScreen';
import ReportsScreen from '../screens/accountant/ReportsScreen';
import { AccountantStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AccountantStackParamList>();

export default function AccountantStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Financial Overview',
        }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Financial Reports',
        }}
      />
    </Stack.Navigator>
  );
} 