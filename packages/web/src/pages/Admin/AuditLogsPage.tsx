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
  TextField,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import { AuditLogService, AuditLogEntry } from '@smart-accounting/shared';
import { format } from 'date-fns';

const ACTIONS = [
  'login',
  'logout',
  'password_reset',
  'device_verification',
  'data_export',
  'data_import',
  'user_creation',
  'user_update',
  'role_change'
];

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const auditLogService = AuditLogService.getInstance();

  useEffect(() => {
    loadLogs();
  }, [selectedAction, userId]);

  const loadLogs = async () => {
    try {
      let fetchedLogs: AuditLogEntry[];
      if (selectedAction) {
        fetchedLogs = await auditLogService.getLogsByAction(selectedAction);
      } else if (userId) {
        fetchedLogs = await auditLogService.getRecentLogs(userId);
      } else {
        fetchedLogs = await auditLogService.getRecentLogs('', 100);
      }
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Filter by Action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <MenuItem value="">All Actions</MenuItem>
            {ACTIONS.map((action) => (
              <MenuItem key={action} value={action}>
                {action.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Filter by User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.status}
                      color={getStatusColor(log.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {JSON.stringify(log.details)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}; 