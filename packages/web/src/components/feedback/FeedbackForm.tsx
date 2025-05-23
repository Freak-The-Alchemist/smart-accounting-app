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
import { submitFeedback } from '@smart-accounting/shared/src/services/feedback';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onError }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState({
    type: 'bug',
    title: '',
    description: '',
    priority: 'medium',
    platform: 'web'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await submitFeedback({
        ...feedback,
        userId: user.uid,
        deviceInfo: {
          os: navigator.platform,
          browser: navigator.userAgent,
          version: navigator.appVersion
        }
      });
      setShowSuccess(true);
      onSuccess?.();
      setFeedback({
        type: 'bug',
        title: '',
        description: '',
        priority: 'medium',
        platform: 'web'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      onError?.(err instanceof Error ? err : new Error('Failed to submit feedback'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Submit Feedback
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={feedback.type}
            label="Type"
            onChange={(e) => setFeedback({ ...feedback, type: e.target.value })}
          >
            <MenuItem value="bug">Bug Report</MenuItem>
            <MenuItem value="feature">Feature Request</MenuItem>
            <MenuItem value="improvement">Improvement</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Title"
          value={feedback.title}
          onChange={(e) => setFeedback({ ...feedback, title: e.target.value })}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Description"
          value={feedback.description}
          onChange={(e) => setFeedback({ ...feedback, description: e.target.value })}
          multiline
          rows={4}
          required
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={feedback.priority}
            label="Priority"
            onChange={(e) => setFeedback({ ...feedback, priority: e.target.value })}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Feedback submitted successfully!
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