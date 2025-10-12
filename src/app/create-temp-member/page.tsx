"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';

function CreateTempMemberContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const phoneParam = searchParams.get('phone');
  const [phone, setPhone] = useState(phoneParam || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Format phone number when component mounts
  useEffect(() => {
    if (phoneParam && phoneParam.trim()) {
      setPhone(formatPhoneNumber(phoneParam));
    }
  }, [phoneParam]);

  // CRITICAL: Check if user is already registered - redirect to welcome-back
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!name) return;
      
      try {
        const response = await fetch(`/api/user/check?name=${encodeURIComponent(name.trim())}`);
        const data = await response.json();
        
        console.log('Create-temp-member: Checking user status for', name);
        console.log('Create-temp-member: User status:', data.status);
        
        // If user is registered, redirect to welcome-back immediately
        if (data.status === 'REG_MEM') {
          console.log('Create-temp-member: User is registered, redirecting to welcome-back');
          window.location.href = `/welcome-back?name=${encodeURIComponent(name.trim())}&status=registered&memberCode=${data.user.phone}`;
          return;
        }
        
        // If user is pending with sponsor, redirect to welcome-back
        if (data.status === 'PENDING_WITH_SPONSOR') {
          console.log('Create-temp-member: User is pending with sponsor, redirecting to welcome-back');
          window.location.href = `/welcome-back?name=${encodeURIComponent(name.trim())}&status=pending&memberCode=${data.user.memberCode}`;
          return;
        }
        
        // If user is temp member, redirect to welcome-back
        if (data.status === 'TEMP_MEM') {
          console.log('Create-temp-member: User is temp member, redirecting to welcome-back');
          window.location.href = `/welcome-back?name=${encodeURIComponent(name.trim())}&status=temp`;
          return;
        }
        
        // If phone is provided, automatically show confirmation
        if (phoneParam && phoneParam.trim()) {
          setShowConfirmation(true);
        }
        
      } catch (error) {
        console.error('Create-temp-member: Error checking user status:', error);
      }
    };
    
    checkUserStatus();
  }, [name, phoneParam]);

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

  // Auto-redirect after 3 seconds when success is true
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        window.location.href = '/';
      }, 3000); // 3 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  const handleConfirmName = () => {
    if (!name?.trim()) {
      setError('Name is required');
      return;
    }
    setShowConfirmation(true);
  };

  const handleCreateTempMember = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Strip formatting from phone for storage
      const phoneDigits = phone.replace(/\D/g, '');
      
      const response = await fetch('/api/user/create-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          phone: phoneDigits
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Show success message, no redirect
      } else {
        setError(data.error || 'Failed to create temporary member');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">We'll Be In Touch!</h1>
          <p className="text-gray-600 mb-4">
            Hello {name}! You've been set up as a temporary member with phone {formatPhoneNumber(phone)}. A registered family member can now invite you to join.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We'll be in touch when a family member sends you an invitation to complete your registration.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            SUBMIT! WE'LL BE IN TOUCH
          </button>
          <p className="text-xs text-gray-500 mt-2">Redirecting to home page in 3 seconds...</p>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Confirm Your Details
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Please confirm your name and add your phone number to set up your temporary member profile.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              aria-label="Name (pre-filled)"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be your member code
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateTempMember}
            disabled={isLoading || !phone.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create My Profile and Save'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This creates your temporary profile. A family member must invite you to complete registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Join the Family
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Welcome {name}! You're not in our system yet, but we can set you up as a temporary member.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            aria-label="Name (pre-filled)"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-yellow-700 text-left space-y-1">
            <li>â€¢ You'll be created as a temporary member</li>
            <li>â€¢ A registered family member can invite you</li>
            <li>â€¢ Once invited, you'll complete your registration</li>
            <li>â€¢ You'll become a trusted family member</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmName}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Confirm Name
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          This creates your temporary profile. A family member must invite you to complete registration.
        </p>
      </div>
    </div>
  );
}

export default function CreateTempMemberPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTempMemberContent />
    </Suspense>
  );
}




