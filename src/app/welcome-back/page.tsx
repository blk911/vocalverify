'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WelcomeBackContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const userStatus = searchParams.get('status');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = useCallback(() => {
    if (userStatus === 'registered') {
      // Redirect to member dashboard
      window.location.href = `/member-dashboard?memberCode=${searchParams.get('memberCode')}`;
    } else if (userStatus === 'pending') {
      // Redirect to complete registration
      // ✅ FIX: Add autoPhone=true since user already has memberCode (which IS their phone)
      window.location.href = `/complete-registration?memberCode=${searchParams.get('memberCode')}&name=${encodeURIComponent(name || '')}&autoPhone=true`;
    } else if (userStatus === 'temp') {
      // Redirect to waiting page
      window.location.href = `/waiting-for-invite?name=${encodeURIComponent(name || '')}`;
    }
  }, [userStatus, searchParams, name]);

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleContinue]);

  const getStatusMessage = () => {
    switch (userStatus) {
      case 'registered':
        return {
          title: 'Welcome Back!',
          message: `Hello ${name}! You're already a registered member. Redirecting to your dashboard...`,
          buttonText: 'Go to Dashboard',
        };
      case 'pending':
        return {
          title: 'Complete Your Registration',
          message: `Hello ${name}! You have a pending registration. Let's complete it now.`,
          buttonText: 'Complete Registration',
        };
      case 'temp':
        return {
          title: 'Welcome Back!',
          message: `Hello ${name}! You're set up as a temporary member. Checking for invitations...`,
          buttonText: 'Check Status',
        };
      default:
        return {
          title: 'Welcome Back!',
          message: `Hello ${name}! Welcome back to the family.`,
          buttonText: 'Continue',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center'>
        <div className='text-green-500 text-6xl mb-4'>✅</div>
        <h1 className='text-2xl font-bold text-gray-800 mb-4'>
          {statusInfo.title}
        </h1>
        <p className='text-gray-600 mb-6'>{statusInfo.message}</p>

        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={isLoading}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
        >
          {isLoading ? 'Loading...' : statusInfo.buttonText}
        </button>

        <p className='text-xs text-gray-500 text-center mt-4'>
          Auto-redirecting in 3 seconds...
        </p>
      </div>
    </div>
  );
}

export default function WelcomeBackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeBackContent />
    </Suspense>
  );
}
