import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@smart-accounting/shared/contexts/AuthContext';
import { RoleGuard } from '@smart-accounting/shared/components/RoleGuard';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { FuelSalesScreen } from '../screens/FuelSalesScreen';
import { ShiftLogScreen } from '../screens/ShiftLogScreen';
import { ExpenseTrackerScreen } from '../screens/ExpenseTrackerScreen';
import { AccountingScreen } from '../screens/AccountingScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const AttendantTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Fuel Sales':
            iconName = 'local-gas-station';
            break;
          case 'Shift Log':
            iconName = 'schedule';
            break;
          case 'Expenses':
            iconName = 'receipt';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'help';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4F81BD',
      tabBarInactiveTintColor: 'gray'
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Fuel Sales" component={FuelSalesScreen} />
    <Tab.Screen name="Shift Log" component={ShiftLogScreen} />
    <Tab.Screen name="Expenses" component={ExpenseTrackerScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AccountantTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Accounting':
            iconName = 'account-balance';
            break;
          case 'Reports':
            iconName = 'assessment';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'help';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4F81BD',
      tabBarInactiveTintColor: 'gray'
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Accounting" component={AccountingScreen} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const ManagerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Dashboard':
            iconName = 'dashboard';
            break;
          case 'Accounting':
            iconName = 'account-balance';
            break;
          case 'Reports':
            iconName = 'assessment';
            break;
          case 'Audit Logs':
            iconName = 'history';
            break;
          case 'Alerts':
            iconName = 'security';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'help';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4F81BD',
      tabBarInactiveTintColor: 'gray'
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Accounting" component={AccountingScreen} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Audit Logs" component={AuditLogsScreen} />
    <Tab.Screen name="Alerts" component={AlertsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {user.role === 'attendant' && (
              <Stack.Screen name="Main" component={AttendantTabs} />
            )}
            {user.role === 'accountant' && (
              <Stack.Screen name="Main" component={AccountantTabs} />
            )}
            {user.role === 'manager' && (
              <Stack.Screen name="Main" component={ManagerTabs} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 