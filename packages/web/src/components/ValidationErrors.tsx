import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import { z } from 'zod';

interface ValidationErrorsProps {
  errors?: z.ZodError;
  error?: string | null;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors, error }) => {
  if (!errors && !error) {
    return null;
  }

  const errorMessages: string[] = [];

  if (errors) {
    errors.errors.forEach((err) => {
      const path = err.path.join('.');
      const message = err.message;
      errorMessages.push(`${path ? `${path}: ` : ''}${message}`);
    });
  }

  if (error) {
    errorMessages.push(error);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mt: 2,
        backgroundColor: 'error.light',
        color: 'error.contrastText',
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Validation Errors
      </Typography>
      <List dense>
        {errorMessages.map((message, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <ErrorIcon color="error" />
            </ListItemIcon>
            <ListItemText primary={message} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}; 