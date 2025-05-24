import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  List,
  Chip,
  IconButton,
  ActivityIndicator,
  Portal,
  Dialog,
  Button,
  useTheme
} from 'react-native-paper';
import { getFeedback, updateFeedbackStatus } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: Date;
  userId: string;
}

export const FeedbackDashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchFeedback = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getFeedback();
      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeedback();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateFeedbackStatus(id, status);
      await fetchFeedback();
      setShowDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feedback status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.info;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      {feedback.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="titleMedium">{item.title}</Text>
              <View style={styles.chipContainer}>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getPriorityColor(item.priority) }}
                  style={[styles.chip, { borderColor: getPriorityColor(item.priority) }]}
                >
                  {item.priority}
                </Chip>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(item.status) }}
                  style={[styles.chip, { borderColor: getStatusColor(item.status) }]}
                >
                  {item.status}
                </Chip>
              </View>
            </View>

            <Text variant="bodyMedium" style={styles.type}>
              Type: {item.type}
            </Text>

            <Text variant="bodyMedium" style={styles.description}>
              {item.description}
            </Text>

            <Text variant="bodySmall" style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedFeedback(item);
                    setShowDialog(true);
                  }}
                >
                  Update Status
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>Update Feedback Status</Dialog.Title>
          <Dialog.Content>
            <Text>How would you like to update the status of this feedback?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onPress={() => selectedFeedback && handleStatusUpdate(selectedFeedback.id, 'resolved')}
            >
              Mark as Resolved
            </Button>
            <Button
              onPress={() => selectedFeedback && handleStatusUpdate(selectedFeedback.id, 'rejected')}
            >
              Reject
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 24,
  },
  type: {
    marginBottom: 4,
  },
  description: {
    marginTop: 8,
    marginBottom: 8,
  },
  date: {
    opacity: 0.7,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
}); 