import { VoiceInputService } from '../voiceInput';

describe('VoiceInputService', () => {
  let voiceInputService: VoiceInputService;
  let mockRecognition: any;

  beforeEach(() => {
    // Mock SpeechRecognition
    mockRecognition = {
      lang: '',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      onresult: null,
      onerror: null,
      start: jest.fn(),
      stop: jest.fn(),
    };

    // Mock window.SpeechRecognition
    Object.defineProperty(window, 'SpeechRecognition', {
      value: jest.fn(() => mockRecognition),
      writable: true,
    });

    voiceInputService = new VoiceInputService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startListening', () => {
    it('should start listening with default options', () => {
      const onResult = jest.fn();
      const onError = jest.fn();

      voiceInputService.startListening(onResult, onError);

      expect(mockRecognition.lang).toBe('en-US');
      expect(mockRecognition.continuous).toBe(false);
      expect(mockRecognition.interimResults).toBe(true);
      expect(mockRecognition.maxAlternatives).toBe(1);
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should start listening with custom options', () => {
      const onResult = jest.fn();
      const onError = jest.fn();
      const options = {
        language: 'fr-FR',
        continuous: true,
        interimResults: false,
        maxAlternatives: 3,
      };

      voiceInputService.startListening(onResult, onError, options);

      expect(mockRecognition.lang).toBe('fr-FR');
      expect(mockRecognition.continuous).toBe(true);
      expect(mockRecognition.interimResults).toBe(false);
      expect(mockRecognition.maxAlternatives).toBe(3);
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should handle speech recognition results', () => {
      const onResult = jest.fn();
      const onError = jest.fn();

      voiceInputService.startListening(onResult, onError);

      // Simulate speech recognition result
      const mockEvent = {
        results: [
          [
            {
              transcript: 'Test transcript',
              confidence: 0.95,
            },
          ],
        ],
        resultIndex: 0,
        results: {
          isFinal: true,
        },
      };

      mockRecognition.onresult(mockEvent);

      expect(onResult).toHaveBeenCalledWith({
        text: 'Test transcript',
        confidence: 0.95,
        isFinal: true,
      });
    });

    it('should handle speech recognition errors', () => {
      const onResult = jest.fn();
      const onError = jest.fn();

      voiceInputService.startListening(onResult, onError);

      // Simulate speech recognition error
      const mockError = {
        error: 'no-speech',
      };

      mockRecognition.onerror(mockError);

      expect(onError).toHaveBeenCalledWith('Speech recognition error: no-speech');
    });

    it('should handle unsupported browsers', () => {
      // Remove SpeechRecognition from window
      Object.defineProperty(window, 'SpeechRecognition', {
        value: undefined,
        writable: true,
      });

      const onResult = jest.fn();
      const onError = jest.fn();

      voiceInputService.startListening(onResult, onError);

      expect(onError).toHaveBeenCalledWith('Speech recognition is not supported in this browser');
      expect(mockRecognition.start).not.toHaveBeenCalled();
    });
  });

  describe('stopListening', () => {
    it('should stop listening', () => {
      voiceInputService.stopListening();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });
  });

  describe('isVoiceInputSupported', () => {
    it('should return true when SpeechRecognition is supported', () => {
      expect(voiceInputService.isVoiceInputSupported()).toBe(true);
    });

    it('should return false when SpeechRecognition is not supported', () => {
      // Remove SpeechRecognition from window
      Object.defineProperty(window, 'SpeechRecognition', {
        value: undefined,
        writable: true,
      });

      const newVoiceInputService = new VoiceInputService();
      expect(newVoiceInputService.isVoiceInputSupported()).toBe(false);
    });
  });
}); 