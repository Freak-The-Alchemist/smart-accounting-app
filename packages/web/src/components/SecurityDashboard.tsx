import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSecurity } from '@shared/hooks/useSecurity';
import { useAuth } from '@shared/hooks/useAuth';
import { format } from 'date-fns';

interface SecurityMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  suspiciousActivities: number;
  failedLogins: number;
  successfulLogins: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'investigating';
  message: string;
  timestamp: Date;
  details?: any;
}

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getSecurityMetrics, getAlerts, resolveAlert } = useSecurity();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, alertsData] = await Promise.all([
        getSecurityMetrics(),
        getAlerts(),
      ]);
      setMetrics(metricsData);
      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to load security data');
      console.error('Error loading security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleResolveAlert = async () => {
    if (selectedAlert && resolutionNote) {
      try {
        await resolveAlert(selectedAlert.id, resolutionNote);
        setResolveDialogOpen(false);
        setResolutionNote('');
        loadData();
      } catch (err) {
        setError('Failed to resolve alert');
        console.error('Error resolving alert:', err);
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ErrorIcon color="error" />;
      case 'resolved':
        return <CheckCircleIcon color="success" />;
      case 'investigating':
        return <WarningIcon color="warning" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading security data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Security Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={loadData}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Alerts
            </Typography>
            <Typography variant="h3">{metrics?.totalAlerts || 0}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            <Typography variant="h3" color="error">
              {metrics?.activeAlerts || 0}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Suspicious Activities
            </Typography>
            <Typography variant="h3" color="warning.main">
              {metrics?.suspiciousActivities || 0}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Failed Logins
            </Typography>
            <Typography variant="h3" color="error">
              {metrics?.failedLogins || 0}
            </Typography>
          </Card>
        </Grid>

        {/* Alerts Table */}
        <Grid item xs={12}>
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Security Alerts
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(alert.status)}
                            <Typography ml={1}>{alert.status}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>
                          {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {alert.status === 'active' && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setResolveDialogOpen(true);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Resolve Alert Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)}>
        <DialogTitle>Resolve Alert</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Note"
            fullWidth
            multiline
            rows={4}
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResolveAlert}
            color="primary"
            disabled={!resolutionNote}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard; 