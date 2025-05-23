import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Switch, Text, Button } from 'react-native-paper';
import { theme } from '@smart-accounting/shared/theme';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setEmailNotifications(data.emailNotifications || false);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emailNotifications: !emailNotifications,
      });
      setEmailNotifications(!emailNotifications);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text>Loading settings...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          Notification Settings
        </Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text variant="bodyLarge" style={styles.settingTitle}>
              Daily Summary Emails
            </Text>
            <Text variant="bodyMedium" style={styles.settingDescription}>
              Receive a daily summary of your sales and expenses via email
            </Text>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={handleToggle}
            disabled={saving}
            color={theme.colors.primary}
          />
        </View>

        {saving && (
          <Text style={styles.savingText}>Saving changes...</Text>
        )}
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
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    color: theme.colors.text,
    ...theme.typography.mobile.body1,
  },
  settingDescription: {
    color: theme.colors.textSecondary,
    ...theme.typography.mobile.body2,
  },
  savingText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    ...theme.typography.mobile.body2,
  },
}); 