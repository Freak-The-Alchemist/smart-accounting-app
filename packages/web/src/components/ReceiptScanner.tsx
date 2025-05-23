import React, { useState, useRef } from 'react';
import { OCRService, OCRResult } from '@smart-accounting/shared/src/services/OCRService';
import { Transaction } from '@smart-accounting/shared/src/models/Transaction';

interface ReceiptScannerProps {
  onTransactionExtracted: (transaction: Partial<Transaction>) => void;
  onError: (error: string) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onTransactionExtracted,
  onError
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const ocrService = OCRService.getInstance();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      onError('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setPreview(imageData);
        processImage(imageData);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPreview(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    try {
      const result = await ocrService.processImage(imageData);
      setExtractedData(result);
      
      const transaction = await ocrService.extractTransactionData(imageData);
      onTransactionExtracted(transaction);
    } catch (error) {
      onError('Failed to process image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetry = () => {
    setPreview(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="receipt-scanner">
      <div className="scanner-controls">
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={stopCamera}>Stop Camera</button>
        <button onClick={captureImage}>Capture</button>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
        />
      </div>

      <div className="scanner-preview">
        {preview ? (
          <img src={preview} alt="Receipt preview" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: '500px' }}
          />
        )}
      </div>

      {isScanning && (
        <div className="scanning-indicator">
          <div className="spinner"></div>
          <p>Processing receipt...</p>
        </div>
      )}

      {extractedData && (
        <div className="extracted-data">
          <h3>Extracted Information</h3>
          <div className="data-grid">
            <div>
              <strong>Merchant:</strong> {extractedData.extractedData.merchant}
            </div>
            <div>
              <strong>Date:</strong>{' '}
              {extractedData.extractedData.date?.toLocaleDateString()}
            </div>
            <div>
              <strong>Amount:</strong>{' '}
              {extractedData.extractedData.amount?.toLocaleString()}
            </div>
            <div>
              <strong>Confidence:</strong>{' '}
              {(extractedData.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <button onClick={handleRetry}>Scan Another Receipt</button>
        </div>
      )}

      <style jsx>{`
        .receipt-scanner {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .scanner-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .scanner-preview {
          margin-bottom: 20px;
          text-align: center;
        }

        .scanner-preview img,
        .scanner-preview video {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .scanning-indicator {
          text-align: center;
          margin: 20px 0;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .extracted-data {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }

        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }

        button:hover {
          background: #0056b3;
        }

        input[type="file"] {
          display: none;
        }
      `}</style>
    </div>
  );
}; 