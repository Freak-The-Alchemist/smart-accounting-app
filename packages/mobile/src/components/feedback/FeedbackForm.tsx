import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Snackbar,
  Portal,
  Dialog,
  useTheme
} from 'react-native-paper';
import { submitFeedback } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const [feedback, setFeedback] = useState({
    type: 'bug',
    title: '',
    description: '',
    priority: 'medium',
    platform: 'mobile'
  });

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await submitFeedback({
        ...feedback,
        userId: user.uid,
        deviceInfo: {
          os: Platform.OS,
          device: Platform.constants?.Brand,
          version: Platform.Version?.toString()
        }
      });
      setShowSuccess(true);
      onSuccess?.();
      setFeedback({
        type: 'bug',
        title: '',
        description: '',
        priority: 'medium',
        platform: 'mobile'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      setShowError(true);
      onError?.(err instanceof Error ? err : new Error('Failed to submit feedback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Submit Feedback
        </Text>

        <SegmentedButtons
          value={feedback.type}
          onValueChange={value => setFeedback({ ...feedback, type: value })}
          buttons={[
            { value: 'bug', label: 'Bug' },
            { value: 'feature', label: 'Feature' },
            { value: 'improvement', label: 'Improvement' },
            { value: 'other', label: 'Other' }
          ]}
          style={styles.segmentedButtons}
        />

        <TextInput
          label="Title"
          value={feedback.title}
          onChangeText={title => setFeedback({ ...feedback, title })}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={feedback.description}
          onChangeText={description => setFeedback({ ...feedback, description })}
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <SegmentedButtons
          value={feedback.priority}
          onValueChange={value => setFeedback({ ...feedback, priority: value })}
          buttons={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
          style={styles.segmentedButtons}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Submit Feedback
        </Button>
      </View>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setShowSuccess(false)
        }}
      >
        Feedback submitted successfully!
      </Snackbar>

      <Portal>
        <Dialog visible={showError} onDismiss={() => setShowError(false)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowError(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    padding: 16
  },
  title: {
    marginBottom: 16,
    textAlign: 'center'
  },
  segmentedButtons: {
    marginBottom: 16
  },
  input: {
    marginBottom: 16
  },
  button: {
    marginTop: 8
  }
}); 