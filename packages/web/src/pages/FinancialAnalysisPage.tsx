import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { FinancialAnalysis } from '../components/FinancialAnalysis';

export const FinancialAnalysisPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Financial Analysis
        </Typography>
        <Paper sx={{ p: 3 }}>
          <FinancialAnalysis />
        </Paper>
      </Box>
    </Container>
  );
}; 