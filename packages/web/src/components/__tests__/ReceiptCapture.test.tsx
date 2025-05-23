import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReceiptCapture } from '../ReceiptCapture';

// Mock the mediaDevices API
const mockMediaStream = {
  getTracks: () => [
    { stop: jest.fn() }
  ]
};

Object.defineProperty(window.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
  },
  writable: true
});

describe('ReceiptCapture', () => {
  const mockOnImageProcess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders capture and upload buttons when not capturing', () => {
    render(<ReceiptCapture onImageProcess={mockOnImageProcess} />);
    
    expect(screen.getByText('Open Camera')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('starts camera capture when Open Camera is clicked', async () => {
    render(<ReceiptCapture onImageProcess={mockOnImageProcess} />);
    
    fireEvent.click(screen.getByText('Open Camera'));
    
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: 'environment' }
      });
    });
    
    expect(screen.getByText('Stop Camera')).toBeInTheDocument();
  });

  it('stops camera capture when Stop Camera is clicked', async () => {
    render(<ReceiptCapture onImageProcess={mockOnImageProcess} />);
    
    // Start capture
    fireEvent.click(screen.getByText('Open Camera'));
    await waitFor(() => {
      expect(screen.getByText('Stop Camera')).toBeInTheDocument();
    });
    
    // Stop capture
    fireEvent.click(screen.getByText('Stop Camera'));
    
    expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(screen.getByText('Open Camera')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    render(<ReceiptCapture onImageProcess={mockOnImageProcess} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    fireEvent.change(input);
    
    await waitFor(() => {
      expect(mockOnImageProcess).toHaveBeenCalled();
    });
  });

  it('handles camera capture error', async () => {
    const mockError = new Error('Camera access denied');
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(mockError);
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    
    render(<ReceiptCapture onImageProcess={mockOnImageProcess} />);
    
    fireEvent.click(screen.getByText('Open Camera'));
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error accessing camera:', mockError);
      expect(alertSpy).toHaveBeenCalledWith('Unable to access camera. Please check your permissions.');
    });
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
}); 