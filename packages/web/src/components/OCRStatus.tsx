import React from 'react';
import '../styles/OCRStatus.css';

interface OCRStatusProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export const OCRStatus: React.FC<OCRStatusProps> = ({
  status,
  progress,
  error,
}) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Processing receipt...';
      case 'success':
        return 'Receipt processed successfully!';
      case 'error':
        return 'Error processing receipt';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <div className={`ocr-status ${status}`}>
      <div className="status-content">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-message">{getStatusMessage()}</span>
      </div>

      {status === 'processing' && progress !== undefined && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      {status === 'error' && error && (
        <div className="error-message">
          <p>{error}</p>
          <p className="error-hint">
            Please try again or upload a clearer image.
          </p>
        </div>
      )}
    </div>
  );
}; 