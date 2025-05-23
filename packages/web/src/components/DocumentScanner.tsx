import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Camera as CameraIcon } from '@mui/icons-material';
import Tesseract from 'tesseract.js';

interface DocumentScannerProps {
  onScanComplete: (text: string) => void;
  onError?: (error: Error) => void;
}

export function DocumentScanner({ onScanComplete, onError }: DocumentScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m),
      });

      onScanComplete(result.data.text);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="document-scanner"
      />
      <label htmlFor="document-scanner">
        <Button
          variant="contained"
          component="span"
          startIcon={isScanning ? <CircularProgress size={20} /> : <CameraIcon />}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Scan Document'}
        </Button>
      </label>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
} 