'use client';
import { useState } from 'react';

interface NameInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminDashboard: (name: string) => void;
  onMemberDashboard: (name: string) => void;
}

export default function NameInputModal({
  isOpen,
  onClose,
  onAdminDashboard,
  onMemberDashboard,
}: NameInputModalProps) {
  const [userName, setUserName] = useState('');

  const handleAdminDashboard = () => {
    if (userName.trim()) {
      onAdminDashboard(userName.trim());
    }
  };

  const handleMemberDashboard = () => {
    if (userName.trim()) {
      onMemberDashboard(userName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Name</h2>
        <p className="text-gray-600 mb-6 text-center">
          Please enter your name to continue
        </p>
        
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Your name"
          className="w-full p-3 border border-gray-300 rounded-lg mb-6 text-center text-lg"
          autoFocus
        />
        
        <div className="space-y-3">
          <button
            onClick={handleAdminDashboard}
            disabled={!userName.trim()}
            className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            ADMIN DASHBOARD
          </button>
          
          <button
            onClick={handleMemberDashboard}
            disabled={!userName.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            MEMBER DASHBOARD
          </button>
        </div>
        
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

