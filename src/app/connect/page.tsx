"use client";
import { useState, useEffect } from "react";
import { deviceFingerprint } from '@/lib/deviceFingerprint';
import { toProperCase, validateFullName } from '@/utils/nameUtils';

export default function ConnectPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPhoneCapture, setShowPhoneCapture] = useState(false);
  const [hasInvite, setHasInvite] = useState(false); // Track if user has invite
  const [phone, setPhone] = useState("");
  const [showThankYou, setShowThankYou] = useState(false);
  
  // ✅ Pre-fill phone from invite when phone capture modal opens
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return digits;
  };
  
  useEffect(() => {
    if (showPhoneCapture) {
      const pendingInviteStr = sessionStorage.getItem('pendingInvite');
      if (pendingInviteStr) {
        const pendingInvite = JSON.parse(pendingInviteStr);
        if (pendingInvite.phone) {
          const formatted = formatPhoneNumber(pendingInvite.phone);
          setPhone(formatted);
          console.log('✅ Pre-filled phone from invite:', formatted);
        }
      }
    }
  }, [showPhoneCapture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate both names are provided
    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first name and last name are required');
      setIsLoading(false);
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Both first name and last name must be at least 2 characters');
      setIsLoading(false);
      return;
    }

    // Concatenate and normalize to proper case
    const rawName = `${firstName.trim()} ${lastName.trim()}`;
    const fullName = toProperCase(rawName);
    
    console.log('🔤 Name normalization:', { input: rawName, output: fullName });

    try {
      // Send device fingerprint for security
      await deviceFingerprint.sendFingerprint(fullName);

      console.log('\n🔥 [CONNECT] Calling check-with-invite API...');
      const response = await fetch(`/api/user/check-with-invite?name=${encodeURIComponent(fullName)}`);
      const data = await response.json();

      console.log('\n🔥 [CONNECT] API RESPONSE RECEIVED 🔥');
      console.log('[CONNECT] data.exists:', data.exists);
      console.log('[CONNECT] data.hasInvite:', data.hasInvite);
      console.log('[CONNECT] data.invite?.sponsorId:', data.invite?.sponsorId);
      console.log('[CONNECT] Full response:', JSON.stringify(data, null, 2));

      if (response.ok) {
        // CORRECTED 3-PATH LOGIC - USER ONLY ENTERS FIRST/LAST NAME
        if (data.exists && data.user) {
          // PATH 1: Existing user found → redirect to dashboard
          const memberCode = data.user.memberCode || data.user.phone;
          window.location.href = `/welcome-back?name=${encodeURIComponent(fullName)}&status=registered&memberCode=${memberCode}`;
        } else if (data.hasInvite && data.invite) {
          // PATH 2: Has pending invite → ALWAYS show phone confirmation modal
          console.log('\n🔥🔥🔥 [CONNECT] INVITE FOUND - SHOWING PHONE MODAL 🔥🔥🔥');
          console.log('[CONNECT] Invite details:', {
            id: data.invite.id,
            name: data.invite.name,
            phone: data.invite.phone,
            sponsorId: data.invite.sponsorId,
            sponsorName: data.invite.sponsorName
          });
          console.log('[CONNECT] Storing invite in sessionStorage');
          sessionStorage.setItem('pendingInvite', JSON.stringify(data.invite));
          setHasInvite(true);
          setShowPhoneCapture(true);
        } else {
          // PATH 3: NOT_REG - Name not found and no invite → Show phone capture
          setHasInvite(false);
          setShowPhoneCapture(true);
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


  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Store phone number in database
      const phoneDigits = phone.replace(/\D/g, '');
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Check if there's a pending invite
      const pendingInviteStr = sessionStorage.getItem('pendingInvite');
      const pendingInvite = pendingInviteStr ? JSON.parse(pendingInviteStr) : null;
      
      console.log('\n🔥🔥🔥 [CONNECT] SUBMITTING PHONE 🔥🔥🔥');
      console.log('[CONNECT] Phone capture request:', { 
        name: fullName, 
        phone: phoneDigits, 
        hasInvite: !!pendingInvite,
        inviteId: pendingInvite?.id,
        sponsorId: pendingInvite?.sponsorId
      });
      
      const response = await fetch('/api/user/capture-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          phone: phoneDigits,
          inviteId: pendingInvite?.id
        })
      });
      
      const data = await response.json();
      console.log('\n🔥 [CONNECT] PHONE CAPTURE RESPONSE 🔥');
      console.log('[CONNECT] Response status:', response.status);
      console.log('[CONNECT] Response data:', data);
      console.log('[CONNECT] User created?', !!data.user);
      console.log('[CONNECT] User memberCode:', data.user?.memberCode);
      
      if (response.ok) {
        // Clear pending invite from session
        sessionStorage.removeItem('pendingInvite');
        
        if (data.hasInvite && data.user) {
          // User created from invite - redirect to complete registration
          console.log('\n🔥🔥🔥 [CONNECT] USER CREATED - REDIRECTING 🔥🔥🔥');
          console.log('[CONNECT] Redirect URL: /complete-registration');
          console.log('[CONNECT] memberCode:', data.user.memberCode);
          console.log('[CONNECT] autoPhone: true');
          // ✅ FIX: Add autoPhone=true since phone was already captured on this page
          window.location.href = `/complete-registration?memberCode=${data.user.memberCode}&name=${encodeURIComponent(fullName)}&autoPhone=true`;
        } else {
          // No invite - show thank you modal
          console.log('✅ Phone captured successfully');
          setShowThankYou(true);
        }
      } else {
        console.error('❌ Phone capture failed:', data);
        // Handle phone mismatch error specially
        if (data.code === 'PHONE_MISMATCH' && data.expectedPhone) {
          const formatted = formatPhoneNumber(data.expectedPhone);
          setError(`This invitation is for phone number ${formatted}. Please use that number to continue.`);
          // Reset phone to the expected value
          setPhone(formatted);
        } else {
          setError(data.error || 'Failed to submit phone number. Please try again.');
        }
      }
      
    } catch (error) {
      console.error('❌ Phone capture error:', error);
      setError('Failed to submit phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    // Redirect to home page
    window.location.href = '/';
  };

  // STEP 3: Thank you modal
  if (showThankYou) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            We have your information, we'll be in touch.
          </p>
          <button
            onClick={handleThankYouClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: Phone capture
  if (showPhoneCapture) {
    // Use state instead of sessionStorage to prevent race condition
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {hasInvite ? '🎉 Complete Your Registration' : 'Name NOT FOUND!'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {hasInvite 
              ? 'Enter your phone number to complete registration' 
              : 'Enter your phone and we\'ll be in touch'}
          </p>
          
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div suppressHydrationWarning>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                PHONE NUMBER *
              </label>
              {hasInvite && phone && (
                <p className="text-sm text-blue-600 mb-2">
                  ✓ This is the phone number from your invitation. Please confirm it's correct.
                </p>
              )}
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
              disabled={isLoading || !phone.trim()}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowPhoneCapture(false);
                setHasInvite(false); // Reset invite state
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Try Different Name
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Name entry form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Connect to AM I HUMAN.net</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                FIRST NAME *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First name"
                required
                minLength={2}
              />
            </div>
            <div suppressHydrationWarning>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                LAST NAME *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Last name"
                required
                minLength={2}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Enter'}
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
              👥 Site Wide Member Dash
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}