'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WaitingForInviteContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExit = () => {
    // Redirect to wait-exit page with modal
    window.location.href = '/wait-exit';
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      <div className='bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center'>
        <div className='text-blue-500 text-6xl mb-4'>⏳</div>
        <h1 className='text-2xl font-bold text-gray-800 mb-4'>
          Waiting for Invitation
        </h1>
        <p className='text-gray-600 mb-6'>
          Hello {name}! You're set up as a temporary member. A registered family
          member needs to send you an invitation with your phone number to
          complete your registration.
        </p>

        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
          <h3 className='font-semibold text-blue-800 mb-2'>
            What happens next?
          </h3>
          <ul className='text-sm text-blue-700 text-left space-y-1'>
            <li>• A registered family member will add your phone number</li>
            <li>• You'll receive a notification to complete registration</li>
            <li>• Once completed, you'll become a trusted family member</li>
          </ul>
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        <button
          onClick={handleExit}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 mb-4'
        >
          EXIT
        </button>

        <p className='text-xs text-gray-500'>
          You can check back here anytime to see if your invitation has arrived.
        </p>
      </div>
    </div>
  );
}

export default function WaitingForInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitingForInviteContent />
    </Suspense>
  );
}
