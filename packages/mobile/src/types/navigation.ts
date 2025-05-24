import { NavigatorScreenParams } from '@react-navigation/native';

export type AccountantStackParamList = {
  Dashboard: undefined;
  Reports: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Settings: undefined;
};

export type MainTabParamList = {
  AccountantStack: NavigatorScreenParams<AccountantStackParamList>;
  FuelSales: undefined;
  Shifts: undefined;
  Expenses: undefined;
}; 