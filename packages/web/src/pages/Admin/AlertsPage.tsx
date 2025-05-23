import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { MoreVert, CheckCircle, Error, Warning } from '@mui/icons-material';
import { MonitoringService } from '@smart-accounting/shared';
import { format } from 'date-fns';

interface Alert {
  type: 'suspicious_login' | 'multiple_failures' | 'unusual_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  userId?: string;
  details: any;
  status: 'new' | 'acknowledged' | 'resolved';
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const monitoringService = MonitoringService.getInstance();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const fetchedAlerts = await monitoringService.getRecentAlerts();
      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, alert: Alert) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlert(alert);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlert(null);
  };

  const handleStatusChange = async (status: Alert['status']) => {
    if (selectedAlert) {
      try {
        // Update alert status in Firestore
        await monitoringService.updateAlertStatus(selectedAlert, status);
        setSnackbar({
          open: true,
          message: `Alert status updated to ${status}`
        });
        loadAlerts(); // Reload alerts
      } catch (error) {
        console.error('Failed to update alert status:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update alert status'
        });
      }
    }
    handleMenuClose();
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <CheckCircle color="info" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Alerts
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((alert, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {format(alert.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>{alert.type.replace('_', ' ').toUpperCase()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSeverityIcon(alert.severity)}
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>
                    <Chip
                      label={alert.status}
                      color={alert.status === 'new' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, alert)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={alerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('acknowledged')}>
          Mark as Acknowledged
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('resolved')}>
          Mark as Resolved
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity="success"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 