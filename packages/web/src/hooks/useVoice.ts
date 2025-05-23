import { useEffect, useCallback, useState } from 'react';
import { VoiceService, VoiceCommand } from '@smart-accounting/shared/src/services/VoiceService';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [availableCommands, setAvailableCommands] = useState<VoiceCommand[]>([]);
  const voiceService = VoiceService.getInstance();

  useEffect(() => {
    setIsSupported(voiceService.isVoiceSupported());
    setAvailableCommands(voiceService.getAvailableCommands());
  }, []);

  const speak = useCallback((text: string) => {
    voiceService.speak(text);
  }, []);

  const registerCommand = useCallback((command: VoiceCommand) => {
    voiceService.registerCommand(command);
    setAvailableCommands(voiceService.getAvailableCommands());
  }, []);

  const unregisterCommand = useCallback((command: string) => {
    voiceService.unregisterCommand(command);
    setAvailableCommands(voiceService.getAvailableCommands());
  }, []);

  const startListening = useCallback(() => {
    voiceService.startListening();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    availableCommands,
    speak,
    registerCommand,
    unregisterCommand,
    startListening,
    stopListening,
  };
}; 