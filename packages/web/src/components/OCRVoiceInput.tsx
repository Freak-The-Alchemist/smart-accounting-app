import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Mic as MicIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { ocrVoiceService, OCRResult, VoiceInputResult } from '@shared/services/ocrVoiceService';

interface OCRVoiceInputProps {
  onTransactionDataExtracted: (data: {
    amount: number;
    date: Date;
    vendor: string;
    items: string[];
  }) => void;
}

export const OCRVoiceInput: React.FC<OCRVoiceInputProps> = ({
  onTransactionDataExtracted,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [voiceResult, setVoiceResult] = useState<VoiceInputResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScanReceipt = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      const hasPermission = await ocrVoiceService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const results = await ocrVoiceService.scanReceipt();
      setOcrResults(results);

      if (results.length > 0) {
        const transactionData = await ocrVoiceService.extractTransactionData(results);
        onTransactionDataExtracted(transactionData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan receipt');
    } finally {
      setIsScanning(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);
      
      const hasPermission = await ocrVoiceService.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      await ocrVoiceService.startVoiceRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await ocrVoiceService.stopVoiceRecording();
      setVoiceResult(result);
      setIsRecording(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsRecording(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Scan Receipt or Voice Input
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={handleScanReceipt}
            disabled={isScanning || isRecording}
          >
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </Button>

          {!isRecording ? (
            <Button
              variant="contained"
              startIcon={<MicIcon />}
              onClick={handleStartRecording}
              disabled={isScanning}
            >
              Start Voice Input
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<StopIcon />}
              onClick={handleStopRecording}
            >
              Stop Recording
            </Button>
          )}
        </Stack>

        {isScanning && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" gutterBottom>
            {error}
          </Typography>
        )}

        {ocrResults.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              OCR Results:
            </Typography>
            {ocrResults.map((result, index) => (
              <Typography key={index} variant="body2">
                {result.text} (Confidence: {result.confidence.toFixed(2)})
              </Typography>
            ))}
          </Box>
        )}

        {voiceResult && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Voice Input Result:
            </Typography>
            <Typography variant="body2">
              {voiceResult.text} (Confidence: {voiceResult.confidence.toFixed(2)})
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 