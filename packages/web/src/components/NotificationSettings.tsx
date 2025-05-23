import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  CircularProgress,
} from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { theme } from '@smart-accounting/shared/theme';

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
      <Card sx={{ m: 2, bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ m: 2, bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={emailNotifications}
              onChange={handleToggle}
              disabled={saving}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1" color="text.primary">
                Daily Summary Emails
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Receive a daily summary of your sales and expenses via email
              </Typography>
            </Box>
          }
          sx={{ mt: 1 }}
        />

        {saving && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Saving changes...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 