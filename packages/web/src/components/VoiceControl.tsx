import React, { useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import '../styles/VoiceControl.css';

interface VoiceControlProps {
  onCommand?: (command: string) => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ onCommand }) => {
  const {
    isListening,
    isSupported,
    availableCommands,
    speak,
    registerCommand,
    startListening,
    stopListening,
  } = useVoice();

  useEffect(() => {
    if (!isSupported) {
      console.warn('Voice features are not supported in this browser.');
      return;
    }

    // Register default commands
    registerCommand({
      command: 'help',
      action: () => {
        const helpText = availableCommands
          .map(cmd => `${cmd.command}: ${cmd.description}`)
          .join('. ');
        speak(`Available commands: ${helpText}`);
      },
      description: 'Show available voice commands',
    });

    registerCommand({
      command: 'stop',
      action: () => {
        stopListening();
        speak('Voice commands deactivated');
      },
      description: 'Stop voice recognition',
    });

    return () => {
      stopListening();
    };
  }, [isSupported, registerCommand, availableCommands, speak, stopListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-control unsupported">
        Voice features are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="voice-control">
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={handleToggleListening}
        aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
      >
        <span className="voice-icon">🎤</span>
        {isListening ? 'Stop Voice' : 'Start Voice'}
      </button>

      {isListening && (
        <div className="voice-status">
          <div className="listening-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Listening for commands...</p>
        </div>
      )}

      <div className="available-commands">
        <h3>Available Commands:</h3>
        <ul>
          {availableCommands.map((cmd) => (
            <li key={cmd.command}>
              <strong>{cmd.command}</strong>: {cmd.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 