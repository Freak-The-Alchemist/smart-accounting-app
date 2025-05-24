import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
    <View style={styles.container}>
      <Text style={styles.title}>Scan Receipt or Voice Input</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, (isScanning || isRecording) && styles.buttonDisabled]}
          onPress={handleScanReceipt}
          disabled={isScanning || isRecording}
        >
          <MaterialIcons name="camera-alt" size={24} color="white" />
          <Text style={styles.buttonText}>
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </Text>
        </TouchableOpacity>

        {!isRecording ? (
          <TouchableOpacity
            style={[styles.button, isScanning && styles.buttonDisabled]}
            onPress={handleStartRecording}
            disabled={isScanning}
          >
            <MaterialIcons name="mic" size={24} color="white" />
            <Text style={styles.buttonText}>Start Voice Input</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <MaterialIcons name="stop" size={24} color="white" />
            <Text style={styles.buttonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>

      {isScanning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <ScrollView style={styles.resultsContainer}>
        {ocrResults.length > 0 && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>OCR Results:</Text>
            {ocrResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result.text} (Confidence: {result.confidence.toFixed(2)})
              </Text>
            ))}
          </View>
        )}

        {voiceResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Voice Input Result:</Text>
            <Text style={styles.resultText}>
              {voiceResult.text} (Confidence: {voiceResult.confidence.toFixed(2)})
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
  },
  resultsContainer: {
    maxHeight: 300,
  },
  resultSection: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 