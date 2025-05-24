import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

interface LoadingSkeletonProps {
  type: 'card' | 'list' | 'form';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  const theme = useTheme();

  const renderCardSkeleton = () => (
    <Surface style={styles.card}>
      <View style={styles.cardContent}>
        <View style={[styles.title, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />
      </View>
    </Surface>
  );

  const renderListSkeleton = () => (
    <Surface style={styles.list}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.listItem}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
          <View style={styles.listItemContent}>
            <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />
            <View style={styles.spacer} />
            <View style={[styles.line, { width: '60%', backgroundColor: theme.colors.surfaceVariant }]} />
          </View>
        </View>
      ))}
    </Surface>
  );

  const renderFormSkeleton = () => (
    <Surface style={styles.form}>
      <View style={styles.formContent}>
        <View style={[styles.line, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]} />
        <View style={styles.spacer} />
        <View style={[styles.button, { backgroundColor: theme.colors.surfaceVariant }]} />
      </View>
    </Surface>
  );

  switch (type) {
    case 'card':
      return renderCardSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'form':
      return renderFormSkeleton();
    default:
      return null;
  }
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  list: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  form: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  formContent: {
    padding: 16,
  },
  title: {
    height: 24,
    width: '60%',
    borderRadius: 4,
  },
  line: {
    height: 16,
    width: '100%',
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  input: {
    height: 48,
    width: '100%',
    borderRadius: 4,
  },
  button: {
    height: 48,
    width: '100%',
    borderRadius: 4,
  },
  spacer: {
    height: 16,
  },
}); 