import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Phone as PhoneIcon,
  History as HistoryIcon,
  Lock as LockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSecurity } from '@smart-accounting/shared/hooks/useSecurity';
import { useAuth } from '@smart-accounting/shared/hooks/useAuth';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const SecurityPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    error,
    auditLogs,
    setupTwoFactor,
    verifyTwoFactor,
    logAuditEvent,
    getAuditLogs,
  } = useSecurity();

  const [selectedTab, setSelectedTab] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadAuditLogs();
  }, [dateRange]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSetupTwoFactor = async () => {
    try {
      const id = await setupTwoFactor(phoneNumber);
      setVerificationId(id);
      setShowVerificationDialog(true);
    } catch (err) {
      console.error('Error setting up 2FA:', err);
    }
  };

  const handleVerifyTwoFactor = async () => {
    try {
      await verifyTwoFactor(verificationCode);
      setShowVerificationDialog(false);
      setVerificationCode('');
      setPhoneNumber('');
    } catch (err) {
      console.error('Error verifying 2FA:', err);
    }
  };

  const loadAuditLogs = async () => {
    await getAuditLogs({
      startDate: new Date(dateRange.startDate),
      endDate: new Date(dateRange.endDate),
    });
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'login':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab icon={<PhoneIcon />} label="Two-Factor Auth" />
          <Tab icon={<HistoryIcon />} label="Audit Trail" />
          <Tab icon={<LockIcon />} label="Data Encryption" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Enhance your account security by enabling two-factor authentication.
              You'll receive a verification code via SMS when logging in.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSetupTwoFactor}
                  disabled={!phoneNumber || loading}
                >
                  Setup 2FA
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Audit Trail
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={loadAuditLogs}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(log.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={getActionColor(log.action) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {log.resourceType} ({log.resourceId})
                      </TableCell>
                      <TableCell>
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <Typography key={key} variant="body2">
                            {key}: {JSON.stringify(value)}
                          </Typography>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Encryption
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              All sensitive data in the application is automatically encrypted using
              industry-standard encryption algorithms. Your data is protected both
              in transit and at rest.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Encryption is handled automatically by the system. No manual
              configuration is required.
            </Alert>
          </CardContent>
        </Card>
      </TabPanel>

      <Dialog open={showVerificationDialog} onClose={() => setShowVerificationDialog(false)}>
        <DialogTitle>Verify Phone Number</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Please enter the verification code sent to your phone number.
          </Typography>
          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVerificationDialog(false)}>Cancel</Button>
          <Button
            onClick={handleVerifyTwoFactor}
            variant="contained"
            disabled={!verificationCode || loading}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 