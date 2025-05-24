import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';

interface VoiceInputProps {
  onTranscriptComplete: (text: string) => void;
  onError?: (error: Error) => void;
}

export function VoiceInput({ onTranscriptComplete, onError }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[0].isFinal) {
          onTranscriptComplete(transcript);
        }
      };

      recognition.onerror = (event) => {
        const error = new Error(event.error);
        setError(error.message);
        onError?.(error);
        setIsListening(false);
      };

      setRecognition(recognition);
    } else {
      setError('Speech recognition is not supported in your browser');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onTranscriptComplete, onError]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Button
        variant="contained"
        onClick={toggleListening}
        startIcon={isListening ? <CircularProgress size={20} /> : <MicIcon />}
        disabled={!recognition}
      >
        {isListening ? 'Listening...' : 'Start Voice Input'}
      </Button>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
} 