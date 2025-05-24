import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceControl } from '../VoiceControl';
import { useVoice } from '../../hooks/useVoice';

// Mock the useVoice hook
jest.mock('../../hooks/useVoice');

describe('VoiceControl', () => {
  const mockUseVoice = useVoice as jest.MockedFunction<typeof useVoice>;

  beforeEach(() => {
    // Default mock implementation
    mockUseVoice.mockReturnValue({
      isListening: false,
      isSupported: true,
      availableCommands: [
        {
          command: 'help',
          description: 'Show available voice commands',
          action: jest.fn(),
        },
        {
          command: 'stop',
          description: 'Stop voice recognition',
          action: jest.fn(),
        },
      ],
      speak: jest.fn(),
      registerCommand: jest.fn(),
      unregisterCommand: jest.fn(),
      startListening: jest.fn(),
      stopListening: jest.fn(),
    });
  });

  it('renders voice control button when supported', () => {
    render(<VoiceControl />);
    expect(screen.getByRole('button')).toHaveTextContent('Start Voice');
  });

  it('shows unsupported message when voice features are not available', () => {
    mockUseVoice.mockReturnValue({
      ...mockUseVoice(),
      isSupported: false,
    });

    render(<VoiceControl />);
    expect(screen.getByText('Voice features are not supported in this browser.')).toBeInTheDocument();
  });

  it('toggles listening state when button is clicked', () => {
    const { rerender } = render(<VoiceControl />);
    
    // Initial state
    expect(screen.getByRole('button')).toHaveTextContent('Start Voice');
    
    // Click to start listening
    fireEvent.click(screen.getByRole('button'));
    expect(mockUseVoice().startListening).toHaveBeenCalled();
    
    // Update mock to reflect listening state
    mockUseVoice.mockReturnValue({
      ...mockUseVoice(),
      isListening: true,
    });
    
    // Re-render with new state
    rerender(<VoiceControl />);
    expect(screen.getByRole('button')).toHaveTextContent('Stop Voice');
    
    // Click to stop listening
    fireEvent.click(screen.getByRole('button'));
    expect(mockUseVoice().stopListening).toHaveBeenCalled();
  });

  it('displays available commands', () => {
    render(<VoiceControl />);
    
    expect(screen.getByText('Available Commands:')).toBeInTheDocument();
    expect(screen.getByText('help: Show available voice commands')).toBeInTheDocument();
    expect(screen.getByText('stop: Stop voice recognition')).toBeInTheDocument();
  });

  it('shows listening indicator when active', () => {
    mockUseVoice.mockReturnValue({
      ...mockUseVoice(),
      isListening: true,
    });

    render(<VoiceControl />);
    
    expect(screen.getByText('Listening for commands...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('listening');
  });

  it('calls onCommand prop when a command is recognized', () => {
    const onCommand = jest.fn();
    render(<VoiceControl onCommand={onCommand} />);
    
    // Simulate command recognition
    act(() => {
      const helpCommand = mockUseVoice().availableCommands[0];
      helpCommand.action();
    });
    
    expect(onCommand).toHaveBeenCalled();
  });
}); 