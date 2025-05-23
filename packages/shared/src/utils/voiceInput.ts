interface VoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceInputResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceInputService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
    }
  }

  startListening(
    onResult: (result: VoiceInputResult) => void,
    onError: (error: string) => void,
    options: VoiceInputOptions = {}
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    const {
      language = 'en-US',
      continuous = false,
      interimResults = true,
      maxAlternatives = 1,
    } = options;

    this.recognition.lang = language;
    this.recognition.continuous = continuous;
    this.recognition.interimResults = interimResults;
    this.recognition.maxAlternatives = maxAlternatives;

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      onResult({
        text: transcript,
        confidence,
        isFinal: result.isFinal,
      });
    };

    this.recognition.onerror = (event) => {
      onError(`Speech recognition error: ${event.error}`);
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isVoiceInputSupported(): boolean {
    return this.isSupported;
  }
}

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
} 