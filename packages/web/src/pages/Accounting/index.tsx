import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useUserRole } from '@smart-accounting/shared/hooks/useUserRole';
import styles from './Accounting.module.css';

export default function Accounting() {
  const { role } = useUserRole();

  return (
    <Box className={styles.container}>
      <Typography variant="h4" component="h1" gutterBottom>
        Accounting Dashboard
      </Typography>
      
      <Paper className={styles.content}>
        <Typography variant="h6" gutterBottom>
          Welcome to the Accounting Dashboard
        </Typography>
        
        <Typography variant="body1" paragraph>
          As an {role}, you have access to:
        </Typography>
        
        <ul className={styles.features}>
          <li>View and manage financial records</li>
          <li>Generate detailed reports</li>
          <li>Track expenses and revenue</li>
          <li>Monitor fuel sales and inventory</li>
        </ul>
      </Paper>
    </Box>
  );
} 