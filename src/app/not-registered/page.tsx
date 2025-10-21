'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function NotRegisteredContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Show modal after a brief delay
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showModal) {
      // Start 4-second countdown
      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            // Redirect to main landing page after countdown
            window.location.href = '/';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownTimer);
    }
  }, [showModal]);

  const handleClose = () => {
    setShowModal(false);
    // Redirect to main landing page immediately
    window.location.href = '/';
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
      {/* Modal Overlay */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4'>
                <span className='text-2xl'>ðŸ“</span>
              </div>

              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                You are not registered
              </h3>

              <p className='text-sm text-gray-600 mb-4'>
                We don't have {name} in our system yet. We'll be in touch when
                your family member invites you.
              </p>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
                <p className='text-sm text-blue-700'>
                  Redirecting in {countdown} seconds...
                </p>
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={handleClose}
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background content */}
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-600'>Processing your request...</p>
      </div>
    </div>
  );
}

export default function NotRegisteredPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotRegisteredContent />
    </Suspense>
  );
}
