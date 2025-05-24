import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { GoogleCloudVision } from '@react-native-google-cloud-vision/google-cloud-vision';

interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VoiceInputResult {
  text: string;
  confidence: number;
}

class OCRVoiceService {
  private static instance: OCRVoiceService;
  private recording: Audio.Recording | null = null;

  private constructor() {}

  static getInstance(): OCRVoiceService {
    if (!OCRVoiceService.instance) {
      OCRVoiceService.instance = new OCRVoiceService();
    }
    return OCRVoiceService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const microphonePermission = await Audio.requestPermissionsAsync();

    return cameraPermission.granted && microphonePermission.granted;
  }

  async scanReceipt(): Promise<OCRResult[]> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });

      if (result.canceled) {
        throw new Error('Receipt scanning cancelled');
      }

      const imageUri = result.assets[0].uri;
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const vision = new GoogleCloudVision({
        apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      });

      const response = await vision.documentTextDetection({
        image: {
          content: base64Image,
        },
      });

      return this.processOCRResponse(response);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      throw error;
    }
  }

  private processOCRResponse(response: any): OCRResult[] {
    const results: OCRResult[] = [];
    
    if (response.fullTextAnnotation) {
      const text = response.fullTextAnnotation.text;
      const confidence = response.fullTextAnnotation.pages[0]?.confidence || 0;
      
      results.push({
        text,
        confidence,
      });
    }

    return results;
  }

  async startVoiceRecording(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
    } catch (error) {
      console.error('Error starting voice recording:', error);
      throw error;
    }
  }

  async stopVoiceRecording(): Promise<VoiceInputResult> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Here you would typically send the audio file to a speech-to-text service
      // For now, we'll return a mock result
      return {
        text: 'Mock transcribed text',
        confidence: 0.95,
      };
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      throw error;
    }
  }

  async extractTransactionData(ocrResults: OCRResult[]): Promise<{
    amount: number;
    date: Date;
    vendor: string;
    items: string[];
  }> {
    // Implement logic to extract transaction data from OCR results
    // This is a simplified example
    const text = ocrResults.map(result => result.text).join(' ');
    
    return {
      amount: this.extractAmount(text),
      date: this.extractDate(text),
      vendor: this.extractVendor(text),
      items: this.extractItems(text),
    };
  }

  private extractAmount(text: string): number {
    // Implement amount extraction logic
    const amountMatch = text.match(/\$?\d+\.\d{2}/);
    return amountMatch ? parseFloat(amountMatch[0].replace('$', '')) : 0;
  }

  private extractDate(text: string): Date {
    // Implement date extraction logic
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    return dateMatch ? new Date(dateMatch[0]) : new Date();
  }

  private extractVendor(text: string): string {
    // Implement vendor extraction logic
    const lines = text.split('\n');
    return lines[0] || 'Unknown Vendor';
  }

  private extractItems(text: string): string[] {
    // Implement items extraction logic
    const lines = text.split('\n');
    return lines.filter(line => line.trim().length > 0);
  }
}

export const ocrVoiceService = OCRVoiceService.getInstance();
export type { OCRResult, VoiceInputResult }; 