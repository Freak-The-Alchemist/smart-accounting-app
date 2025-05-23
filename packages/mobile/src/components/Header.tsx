import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NotificationCenter } from './notifications/NotificationCenter';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export const Header = ({ title, showBackButton = false, rightAction }: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <Appbar.Header style={styles.header}>
      {showBackButton && (
        <Appbar.BackAction onPress={() => navigation.goBack()} />
      )}
      <Appbar.Content title={title} />
      <View style={styles.actions}>
        <NotificationCenter />
        {rightAction}
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    backgroundColor: '#4F81BD',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 