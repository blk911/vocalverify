"use client";
import { useState, useEffect } from "react";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get name from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const nameParam = urlParams.get('name');
    if (nameParam) {
      setName(nameParam);
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Strip formatting from phone for storage
      const phoneDigits = phone.replace(/\D/g, '');
      
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          memberCode: phoneDigits, // Phone is the member code
          phone: phoneDigits
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirect to member dashboard
        window.location.href = `/member-dashboard?memberCode=${phoneDigits}`;
      } else {
        setError(data.error || 'Failed to create user');
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          New Member Registration
        </h1>
        
        {/* Step 1: Phone Number */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Step 1: Enter Cell Number</h2>
              <p className="text-gray-600 text-sm">This will be your member code</p>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                ENTER CELL NUMBER
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(512) 555-1234"
                required
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!phone}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          </div>
        )}

        {/* Step 2: Profile Picture */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Step 2: Profile Picture</h2>
              <p className="text-gray-600 text-sm">Upload your profile picture (optional)</p>
            </div>
            
            <div>
              <label htmlFor="picture" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Profile Picture
              </label>
              <input
                type="file"
                id="picture"
                accept="image/*"
                onChange={handlePictureChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profilePicture && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {profilePicture.name} selected
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Step 3: Confirmation</h2>
              <p className="text-gray-600 text-sm">Review your information</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Member Code:</span>
                <span className="ml-2 text-gray-900 font-mono">{phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Profile Picture:</span>
                <span className="ml-2 text-gray-900">
                  {profilePicture ? `✓ ${profilePicture.name}` : 'Not uploaded'}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Complete Registration"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/connect" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Name Entry
          </a>
        </div>
      </div>
    </div>
  );
}
