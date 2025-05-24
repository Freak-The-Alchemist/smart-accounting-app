import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { AuthService } from '../services/auth';

interface PasswordRecoveryProps {
  open: boolean;
  onClose: () => void;
}

export const PasswordRecovery: React.FC<PasswordRecoveryProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const auth = AuthService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (recoveryMethod === 'email') {
        await auth.resetPassword(email);
        setSuccess(true);
      } else {
        // Implement phone number recovery if needed
        // This would typically involve sending an SMS with a verification code
        setError('Phone number recovery not implemented yet');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Password Recovery</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Button
            variant={recoveryMethod === 'email' ? 'contained' : 'outlined'}
            onClick={() => setRecoveryMethod('email')}
            sx={{ mr: 1 }}
          >
            Email
          </Button>
          <Button
            variant={recoveryMethod === 'phone' ? 'contained' : 'outlined'}
            onClick={() => setRecoveryMethod('phone')}
          >
            Phone Number
          </Button>
        </Box>

        <form onSubmit={handleSubmit}>
          {recoveryMethod === 'email' ? (
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
            />
          ) : (
            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              margin="normal"
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Password reset instructions have been sent to your {recoveryMethod}.
            </Alert>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Send Recovery Instructions
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 