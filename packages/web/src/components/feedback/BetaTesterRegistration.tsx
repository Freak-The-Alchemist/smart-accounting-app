import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { registerBetaTester } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';

interface BetaTesterRegistrationProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const BetaTesterRegistration: React.FC<BetaTesterRegistrationProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tester, setTester] = useState({
    name: '',
    role: 'user',
    platform: 'both'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await registerBetaTester({
        ...tester,
        userId: user.uid,
        email: user.email || '',
        deviceInfo: {
          os: navigator.platform,
          browser: navigator.userAgent,
          version: navigator.appVersion
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
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Join Beta Testing Program
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Help us improve Smart Accounting by testing new features and providing feedback.
        As a beta tester, you'll get early access to new features and help shape the future of the app.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Full Name"
          value={tester.name}
          onChange={(e) => setTester({ ...tester, name: e.target.value })}
          required
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={tester.role}
            label="Role"
            onChange={(e) => setTester({ ...tester, role: e.target.value })}
          >
            <MenuItem value="user">Regular User</MenuItem>
            <MenuItem value="accountant">Accountant</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Platform</InputLabel>
          <Select
            value={tester.platform}
            label="Platform"
            onChange={(e) => setTester({ ...tester, platform: e.target.value })}
          >
            <MenuItem value="web">Web Only</MenuItem>
            <MenuItem value="mobile">Mobile Only</MenuItem>
            <MenuItem value="both">Both Web & Mobile</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Join Beta Program'}
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Successfully registered as a beta tester!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}; 