import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  HelperText,
  Snackbar,
  SegmentedButtons,
  useTheme
} from 'react-native-paper';
import { registerBetaTester } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';
import * as Device from 'expo-device';

interface BetaTesterRegistrationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const BetaTesterRegistration: React.FC<BetaTesterRegistrationProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tester, setTester] = useState({
    name: '',
    role: 'user',
    platform: 'both'
  });

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await registerBetaTester({
        ...tester,
        userId: user.uid,
        email: user.email || '',
        deviceInfo: {
          os: Device.osName,
          browser: 'React Native',
          version: Device.osVersion
        }
      });
      setShowSuccess(true);
      onSuccess?.();
      setTester({
        name: '',
        role: 'user',
        platform: 'both'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register as beta tester');
      onError?.(err instanceof Error ? err : new Error('Failed to register as beta tester'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Join Beta Testing Program
          </Text>

          <Text variant="bodyMedium" style={styles.description}>
            Help us improve Smart Accounting by testing new features and providing feedback.
            As a beta tester, you'll get early access to new features and help shape the future of the app.
          </Text>

          <TextInput
            label="Full Name"
            value={tester.name}
            onChangeText={(text) => setTester({ ...tester, name: text })}
            style={styles.input}
          />

          <Text variant="bodyMedium" style={styles.label}>Role</Text>
          <SegmentedButtons
            value={tester.role}
            onValueChange={(value) => setTester({ ...tester, role: value })}
            buttons={[
              { value: 'user', label: 'User' },
              { value: 'accountant', label: 'Accountant' },
              { value: 'admin', label: 'Admin' }
            ]}
            style={styles.segmentedButtons}
          />

          <Text variant="bodyMedium" style={styles.label}>Platform</Text>
          <SegmentedButtons
            value={tester.platform}
            onValueChange={(value) => setTester({ ...tester, platform: value })}
            buttons={[
              { value: 'web', label: 'Web' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'both', label: 'Both' }
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
            {loading ? 'Registering...' : 'Join Beta Program'}
          </Button>

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </Card.Content>
      </Card>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={6000}
        action={{
          label: 'Dismiss',
          onPress: () => setShowSuccess(false),
        }}
      >
        Successfully registered as a beta tester!
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 