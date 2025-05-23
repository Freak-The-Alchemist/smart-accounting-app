import React, { useRef, useState, useCallback } from 'react';
import '../styles/ReceiptCapture.css';

interface ReceiptCaptureProps {
  onImageProcess: (imageData: string) => Promise<void>;
}

export const ReceiptCapture: React.FC<ReceiptCaptureProps> = ({ onImageProcess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCapture = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCapturing(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check your permissions.');
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCapturing(false);
    }
  }, [stream]);

  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        onImageProcess(imageData);
        stopCapture();
      }
    }
  }, [onImageProcess, stopCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        if (imageData) {
          onImageProcess(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageProcess]);

  return (
    <div className="receipt-capture">
      <div className="capture-controls">
        {!isCapturing ? (
          <>
            <button
              className="btn btn-primary"
              onClick={startCapture}
            >
              Open Camera
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              aria-label="Upload Image"
            />
          </>
        ) : (
          <button
            className="btn btn-danger"
            onClick={stopCapture}
          >
            Stop Camera
          </button>
        )}
      </div>

      {isCapturing && (
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          <button
            className="capture-btn"
            onClick={captureImage}
          >
            Capture
          </button>
        </div>
      )}
    </div>
  );
}; 