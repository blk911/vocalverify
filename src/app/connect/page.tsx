"use client";
import { useState } from "react";
import { deviceFingerprint } from '@/lib/deviceFingerprint';

export default function ConnectPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Send device fingerprint for security
      await deviceFingerprint.sendFingerprint(name);
      
      const response = await fetch(`/api/user/check?name=${encodeURIComponent(name.trim())}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.exists) {
          // User exists - redirect to member dashboard
          window.location.href = `/member-dashboard?memberCode=${data.user.phone}`;
        } else {
          // User doesn't exist - redirect to registration
          window.location.href = `/register?name=${encodeURIComponent(name.trim())}`;
        }
      } else {
        setError(data.error || 'Failed to check name');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          AM I HUMAN....
        </h1>
        <p className="text-center text-gray-600 mb-8">
          ONLY YOUR LOVED ONES KNOW...
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              ENTER FIRST LAST NAME
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Checking..." : "ENTER"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Home
          </a>
        </div>

        {/* Temporary Admin and Site Wide Member Dash links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center space-y-2">
            <a 
              href="/admin-dashboard" 
              className="block text-sm text-gray-600 hover:text-blue-600"
            >
              🔧 Admin Dashboard
            </a>
            <a 
              href="/member-dashboard?memberCode=demo" 
              className="block text-sm text-gray-600 hover:text-blue-600"
            >
              👤 Site Wide Member Dash
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

