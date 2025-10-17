"use client";
import { useState, useRef, useEffect } from 'react';

interface SelfieCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  memberName: string;
  cameraAvailable?: boolean;
  cameraError?: string;
  onRetryCamera?: () => void;
}

export default function SelfieCaptureModal({ isOpen, onClose, onConfirm, memberName, cameraAvailable = false, cameraError = '', onRetryCamera }: SelfieCaptureModalProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null); // Store the file directly
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && cameraAvailable) {
      console.log('📷 Modal opened, camera already available, starting stream...');
      startCameraStream();
    } else if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, cameraAvailable]);

  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        console.log('✅ Camera stream started');
      }
    } catch (error) {
      console.error('❌ Failed to start camera stream:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setCapturedFile(file); // Store the file directly
        setIsCapturing(false);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleConfirm = async () => {
    console.log('\n🔥🔥🔥 [MODAL] CONFIRM CLICKED 🔥🔥🔥');
    console.log('[MODAL] capturedFile:', capturedFile ? 'YES' : 'NO');
    console.log('[MODAL] capturedImage:', capturedImage ? 'YES' : 'NO');
    
    if (capturedFile && capturedImage) {
      console.log('[MODAL] Both file and image present, starting upload...');
      setIsUploading(true);
      try {
        console.log('[MODAL] Calling onConfirm handler...');
        // Use the stored file directly
        await onConfirm(capturedFile);
        
        console.log('[MODAL] ✅ onConfirm completed successfully');
        // Clean up
        URL.revokeObjectURL(capturedImage);
        setCapturedImage(null);
        setCapturedFile(null);
        onClose();
      } catch (error) {
        console.error('[MODAL] ❌ Upload error:', error);
        alert('Failed to upload selfie. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      console.log('[MODAL] ❌ Missing file or image, cannot upload');
    }
  };

  const handleCancel = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setIsCapturing(false);
    stopCamera();
    onClose();
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setIsCapturing(true);
    startCameraStream();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <span className="text-2xl">📸</span>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Take a Selfie
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Take a selfie for {memberName}
          </p>
          
          {/* Camera Status Indicator */}
          <div className="mb-4">
            {cameraError ? (
              <div className="flex items-center justify-center p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{cameraError}</span>
                <button
                  onClick={() => {
                    console.log('🔄 Manual retry clicked');
                    onRetryCamera?.();
                  }}
                  className="ml-3 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  🔄 Retry
                </button>
              </div>
            ) : !cameraAvailable ? (
              <div className="flex items-center justify-center p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Checking camera availability...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">📷 Camera Ready!</span>
                <button
                  onClick={() => {
                    console.log('🔄 Manual camera check');
                    onRetryCamera?.();
                  }}
                  className="ml-3 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                >
                  🔍 Check
                </button>
              </div>
            )}
          </div>
          
          {/* Camera Preview */}
          <div className="mb-4">
            {!capturedImage ? (
              cameraAvailable ? (
                <div className="relative inline-block">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-64 h-48 object-cover rounded-lg border-4 border-green-400"
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    📷 LIVE
                  </div>
                </div>
              ) : (
                <div className="w-64 h-48 bg-gray-200 rounded-lg border-4 border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Camera not available</p>
                    <p className="text-xs">Connect your camera</p>
                  </div>
                </div>
              )
            ) : (
              <div className="relative inline-block">
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="w-64 h-48 object-cover rounded-lg border-4 border-blue-400"
                />
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  📸 CAPTURED
                </div>
              </div>
            )}
          </div>
          
          {!capturedImage && cameraAvailable && (
            <p className="text-xs text-gray-500 mb-4 text-center">
              Position your face in the frame and click "Capture Selfie"
            </p>
          )}
          
          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Captured Selfie:</p>
              <div className="relative inline-block">
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="w-64 h-48 object-cover rounded-lg border-4 border-gray-200"
                />
              </div>
            </div>
          )}
          
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-200"
            >
              Cancel
            </button>
            
            {!capturedImage ? (
              <button
                onClick={captureSelfie}
                disabled={!cameraAvailable || isUploading}
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  !cameraAvailable || isUploading
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                    : 'bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500'
                }`}
              >
                {!cameraAvailable ? (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Camera Not Ready
                  </>
                ) : isUploading ? (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    📸 Capture Selfie
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetake}
                  disabled={isUploading}
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-400"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isUploading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  {isUploading ? '⏳ Uploading...' : '✅ Confirm & Upload'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}