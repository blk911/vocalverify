"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import SelfieCaptureModal from '@/components/member/SelfieCaptureModal';

function CompleteRegistrationContent() {
  const searchParams = useSearchParams();
  const memberCode = searchParams.get('memberCode');
  const name = searchParams.get('name');
  const autoPhone = searchParams.get('autoPhone'); // Flag indicating phone already captured
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(autoPhone === 'true' ? 'picture' : 'phone'); // Skip phone if auto
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Check if user is already registered and has profile picture
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!memberCode) return;
      
      try {
        const response = await fetch(`/api/user/profile?memberCode=${memberCode}`);
        const data = await response.json();
        
        if (data.ok && data.profile?.status === 'registered' && data.profile?.hasProfilePicture) {
          // User has already completed registration, redirect to dashboard
          console.log('User already registered with picture, redirecting to dashboard...');
          window.location.href = `/member-dashboard?memberCode=${memberCode}`;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUserStatus();
  }, [memberCode]);

  // Test camera availability on page load
  useEffect(() => {
    testCamera();
  }, []);

  // If autoPhone=true, skip phone step and go directly to selfie
  useEffect(() => {
    console.log('\n🔥 [COMPLETE-REG] useEffect fired');
    console.log('[COMPLETE-REG] autoPhone:', autoPhone);
    console.log('[COMPLETE-REG] registrationStep:', registrationStep);
    console.log('[COMPLETE-REG] Should auto-open modal?', autoPhone === 'true' && registrationStep === 'picture');
    
    if (autoPhone === 'true' && registrationStep === 'picture') {
      console.log('🔥🔥🔥 [COMPLETE-REG] AUTO-OPENING SELFIE MODAL 🔥🔥🔥');
      setShowSelfieModal(true);
    }
  }, [autoPhone, registrationStep]);

  const testCamera = async () => {
    try {
      setCameraError('');
      setCameraAvailable(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Stop the stream immediately - we just needed to test access
      stream.getTracks().forEach(track => track.stop());
      
      setCameraAvailable(true);
      console.log('âœ… Camera available');
    } catch (error: any) {
      console.error('âŒ Camera not available:', error);
      
      let errorMessage = 'Camera not available. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found.';
      } else {
        errorMessage += 'Please check your camera connection.';
      }
      
      setCameraError(errorMessage);
      setCameraAvailable(false);
    }
  };

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

  const handlePhoneConfirm = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Strip formatting from phone for storage
      const phoneDigits = phone.replace(/\D/g, '');
      
      console.log('📞 Phone confirmation request:', { memberCode, phone: phoneDigits, name });
      
      const response = await fetch('/api/user/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberCode: memberCode,
          phone: phoneDigits,
          name: name
        })
      });

      const data = await response.json();
      console.log('📞 Phone confirmation response:', { status: response.status, data });
      
      if (response.ok) {
        console.log('✅ Phone confirmed, moving to selfie step');
        // Move to selfie capture step
        setRegistrationStep('picture');
        setShowSelfieModal(true);
      } else {
        console.error('❌ Phone confirmation failed:', data);
        setError(data.error || 'Failed to complete registration');
      }
    } catch (error) {
      console.error('❌ Phone confirmation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfieUpload = async (file: File) => {
    setIsLoading(true);
    setError("");

    try {
      console.log('📸 Converting selfie to base64...');
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const profilePicture = await base64Promise;
      
      console.log('📸 Selfie upload request:', { 
        memberCode, 
        fileName: file.name, 
        fileSize: file.size,
        base64Length: profilePicture.length 
      });
      
      const response = await fetch('/api/user/upload-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberCode: memberCode,
          profilePicture: profilePicture
        })
      });

      const data = await response.json();
      console.log('📸 Selfie upload response:', { status: response.status, data });
      
      if (response.ok) {
        console.log('✅ Selfie uploaded successfully, completing registration');
        setRegistrationStep('complete');
        setSuccess(true);
        // Redirect to member dashboard after completion
        setTimeout(() => {
          console.log('🔄 Redirecting to dashboard...');
          window.location.href = `/member-dashboard?memberCode=${memberCode}`;
        }, 2000);
      } else {
        console.error('❌ Selfie upload failed:', data);
        setError(data.error || 'Failed to upload selfie');
      }
    } catch (error) {
      console.error('❌ Selfie upload error:', error);
      setError('Failed to upload selfie. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Registration Complete!</h1>
          <p className="text-gray-600 mb-4">
            Welcome to the family, {name}! You are now a trusted member.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show phone entry form only if not autoPhone
  if (registrationStep === 'phone') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Complete Registration
          </h1>
          <p className="text-center text-gray-600 mb-6">
            You were added as a loved one by a registered member. Complete your registration to join the family.
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
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handlePhoneConfirm}
            disabled={isLoading || !phone.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Confirming...' : 'Confirm Phone'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By completing registration, you become a trusted member of the family network.
          </p>
        </div>
      </div>
    );
  }

  // Picture step - show selfie modal
  console.log('[COMPLETE-REG] Rendering picture step, showSelfieModal:', showSelfieModal);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          📸 Profile Picture
        </h1>
        <p className="text-gray-600 mb-6">
          Take a selfie to complete your profile
        </p>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Name: <strong>{name}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Member Code: <strong>{memberCode}</strong>
          </p>
        </div>

        <button
          onClick={() => {
            console.log('🔥 [COMPLETE-REG] Take Selfie button clicked');
            setShowSelfieModal(true);
          }}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
        >
          Take Selfie
        </button>
      </div>

      {/* Selfie Capture Modal */}
      <SelfieCaptureModal
        isOpen={showSelfieModal}
        onClose={() => {
          console.log('[COMPLETE-REG] Modal closed');
          setShowSelfieModal(false);
        }}
        onConfirm={handleSelfieUpload}
        memberName={name || ''}
        cameraAvailable={cameraAvailable}
        cameraError={cameraError}
        onRetryCamera={testCamera}
      />
    </div>
  );
}

export default function CompleteRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteRegistrationContent />
    </Suspense>
  );
}




