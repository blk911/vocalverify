"use client";
import { useState, useRef } from 'react';

interface PictureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  memberName: string;
}

export default function PictureUploadModal({ isOpen, onClose, onConfirm, memberName }: PictureUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleConfirm = async () => {
    if (selectedFile) {
      setIsUploading(true);
      try {
        await onConfirm(selectedFile);
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        onClose();
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload picture. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
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
            Upload Profile Picture
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Add a profile picture for {memberName}
          </p>
          
          {/* File Input */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Select profile picture"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              📁 Select Picture
            </button>
          </div>
          
          {/* Preview */}
          {previewUrl && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
                />
              </div>
            </div>
          )}
          
          {/* File Info */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>File:</strong> {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {selectedFile.type}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? '⏳ Uploading...' : '✅ Confirm & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}