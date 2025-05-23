import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import FuelSaleForm from '../screens/FuelSaleForm';
import ShiftLogScreen from '../screens/ShiftLogScreen';
import ExpenseTrackerScreen from '../screens/ExpenseTrackerScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Fuel Sales':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'Shifts':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Expenses':
              iconName = focused ? 'cash' : 'cash-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
      />
      <Tab.Screen 
        name="Fuel Sales" 
        component={FuelSaleForm}
      />
      <Tab.Screen 
        name="Shifts" 
        component={ShiftLogScreen}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpenseTrackerScreen}
      />
    </Tab.Navigator>
  );
} 