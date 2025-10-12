"use client";
import { useState } from "react";

export default function WaitExitPage() {
  const [showModal, setShowModal] = useState(true);

  const handleEnter = () => {
    // Close modal and redirect to main landing page
    setShowModal(false);
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] h-[600px] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 text-center">
                Am I Human
              </h2>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-gray-600 text-lg">
                  Content will be added here
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleEnter}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                ENTER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background content (hidden when modal is open) */}
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}




