import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { theme } from '@smart-accounting/shared/theme';
import { formatDateRange } from '@smart-accounting/shared/utils/filters';

interface DateRangeFilterProps {
  onFilter: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

export default function DateRangeFilter({ 
  onFilter, 
  initialStart = '', 
  initialEnd = '' 
}: DateRangeFilterProps) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [error, setError] = useState('');

  const handleFilter = () => {
    if (!start || !end) {
      setError('Please select both start and end dates');
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    onFilter(start, end);
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>Date Range Filter</Text>
        
        <View style={styles.dateInputs}>
          <View style={styles.inputContainer}>
            <Text variant="bodyMedium" style={styles.label}>Start Date</Text>
            <TextInput
              mode="outlined"
              value={start}
              onChangeText={setStart}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text variant="bodyMedium" style={styles.label}>End Date</Text>
            <TextInput
              mode="outlined"
              value={end}
              onChangeText={setEnd}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : start && end ? (
          <Text style={styles.dateRange}>
            {formatDateRange(start, end)}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleFilter}
          style={styles.button}
          disabled={!start || !end}
        >
          Apply Filter
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    ...theme.typography.mobile.h3,
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    ...theme.typography.mobile.body2,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    ...theme.typography.mobile.body2,
  },
  dateRange: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    ...theme.typography.mobile.body2,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
}); 