import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSecurity } from '@shared/hooks/useSecurity';
import { useAuth } from '@shared/hooks/useAuth';

interface TwoFactorStatus {
  isEnabled: boolean;
  phoneNumber?: string;
  lastVerified?: Date;
}

const TwoFactorSettings: React.FC = () => {
  const { user } = useAuth();
  const { setupTwoFactor, verifyTwoFactor, disableTwoFactor } = useSecurity();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement status loading from backend
      const mockStatus: TwoFactorStatus = {
        isEnabled: false,
      };
      setStatus(mockStatus);
    } catch (err) {
      setError('Failed to load two-factor status');
      console.error('Error loading two-factor status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  const handleSetupStart = async () => {
    try {
      setError(null);
      await setupTwoFactor(phoneNumber);
      setActiveStep(1);
    } catch (err) {
      setError('Failed to start two-factor setup');
      console.error('Error starting two-factor setup:', err);
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      await verifyTwoFactor(verificationCode);
      setVerifyDialogOpen(false);
      setSuccess('Two-factor authentication enabled successfully');
      loadStatus();
    } catch (err) {
      setError('Failed to verify code');
      console.error('Error verifying code:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async () => {
    try {
      setError(null);
      await disableTwoFactor();
      setSuccess('Two-factor authentication disabled successfully');
      loadStatus();
    } catch (err) {
      setError('Failed to disable two-factor authentication');
      console.error('Error disabling two-factor authentication:', err);
    }
  };

  const steps = ['Enter Phone Number', 'Verify Code'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading two-factor settings...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Two-Factor Authentication
        </Typography>
        {!status?.isEnabled && (
          <Button
            startIcon={<PhoneIcon />}
            variant="contained"
            onClick={() => setSetupDialogOpen(true)}
          >
            Enable 2FA
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              {status?.isEnabled ? (
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              ) : (
                <ErrorIcon color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="h6">
                Status: {status?.isEnabled ? 'Enabled' : 'Disabled'}
              </Typography>
            </Box>
            {status?.isEnabled && (
              <>
                <Typography variant="body1" gutterBottom>
                  Phone Number: {status.phoneNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last Verified: {status.lastVerified?.toLocaleDateString()}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisable}
                  sx={{ mt: 2 }}
                >
                  Disable 2FA
                </Button>
              </>
            )}
          </Card>
        </Grid>

        {/* Security Tips */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Security Tips
            </Typography>
            <Typography variant="body2" paragraph>
              • Two-factor authentication adds an extra layer of security to your account
            </Typography>
            <Typography variant="body2" paragraph>
              • You'll need to enter a verification code sent to your phone when logging in
            </Typography>
            <Typography variant="body2" paragraph>
              • Keep your phone number up to date to ensure you can receive verification codes
            </Typography>
            <Typography variant="body2">
              • If you lose access to your phone, contact support immediately
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ my: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {activeStep === 0 ? (
            <TextField
              autoFocus
              margin="dense"
              label="Phone Number"
              type="tel"
              fullWidth
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              helperText="Enter your phone number with country code (e.g., +1234567890)"
            />
          ) : (
            <TextField
              autoFocus
              margin="dense"
              label="Verification Code"
              type="text"
              fullWidth
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              helperText="Enter the 6-digit code sent to your phone"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)}>Cancel</Button>
          {activeStep === 0 ? (
            <Button
              onClick={handleSetupStart}
              variant="contained"
              disabled={!phoneNumber}
            >
              Send Code
            </Button>
          ) : (
            <Button
              onClick={handleVerify}
              variant="contained"
              disabled={!verificationCode || isVerifying}
            >
              {isVerifying ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TwoFactorSettings; 