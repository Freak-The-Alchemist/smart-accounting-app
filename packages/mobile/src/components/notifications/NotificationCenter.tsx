import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  IconButton,
  Text,
  List,
  Divider,
  Button,
  ActivityIndicator,
  useTheme,
  Portal,
  Dialog,
  Card
} from 'react-native-paper';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification
} from '@smart-accounting/shared/src/services/notifications';
import { useAuth } from '../../hooks/useAuth';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setShowMarkAllDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'feedback':
        return 'message-text';
      case 'beta_test':
        return 'flask';
      case 'system':
        return 'cog';
      default:
        return 'bell';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton
        icon="bell"
        size={24}
        onPress={() => setVisible(true)}
        style={styles.iconButton}
      >
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </IconButton>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            <View style={styles.dialogHeader}>
              <Text variant="titleLarge">Notifications</Text>
              {unreadCount > 0 && (
                <Button
                  mode="text"
                  onPress={() => setShowMarkAllDialog(true)}
                  icon="check-all"
                >
                  Mark all as read
                </Button>
              )}
            </View>
          </Dialog.Title>

          <Dialog.Content style={styles.dialogContent}>
            {loading && !refreshing ? (
              <ActivityIndicator style={styles.loader} />
            ) : error ? (
              <Text style={{ color: theme.colors.error }}>{error}</Text>
            ) : notifications.length === 0 ? (
              <Text style={styles.emptyText}>No notifications</Text>
            ) : (
              <ScrollView
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && { backgroundColor: theme.colors.surfaceVariant }
                    ]}
                  >
                    <Card.Content>
                      <View style={styles.notificationHeader}>
                        <IconButton
                          icon={getNotificationIcon(notification.type)}
                          size={20}
                        />
                        <Text variant="titleMedium" style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <IconButton
                            icon="check"
                            size={20}
                            onPress={() => handleMarkAsRead(notification.id)}
                          />
                        )}
                      </View>
                      <Text variant="bodyMedium" style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text variant="bodySmall" style={styles.notificationTime}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
        </Dialog>

        <Dialog visible={showMarkAllDialog} onDismiss={() => setShowMarkAllDialog(false)}>
          <Dialog.Title>Mark all as read?</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to mark all notifications as read?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMarkAllDialog(false)}>Cancel</Button>
            <Button onPress={handleMarkAllAsRead}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  dialog: {
    maxHeight: '80%'
  },
  dialogTitle: {
    padding: 16
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dialogContent: {
    padding: 0
  },
  loader: {
    padding: 20
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.7
  },
  notificationCard: {
    margin: 8,
    marginBottom: 0
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  notificationTitle: {
    flex: 1,
    marginLeft: 8
  },
  notificationMessage: {
    marginBottom: 4
  },
  notificationTime: {
    opacity: 0.7
  }
}); 