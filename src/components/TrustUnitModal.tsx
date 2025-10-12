'use client';

import { useState, useEffect } from 'react';

interface TrustUnitMember {
  memberCode: string;
  name: string;
  status: 'pending_connection' | 'connected' | 'waiting';
  profilePicture?: string;
}

interface TrustUnitOpportunity {
  unitId: string;
  sponsorName: string;
  members: TrustUnitMember[];
  status: string;
  createdAt: string;
}

interface TrustUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  trustUnit: TrustUnitOpportunity | null;
  currentMemberCode: string;
  onConnect: (memberCode: string) => void;
  onWait: (memberCode: string) => void;
}

export default function TrustUnitModal({
  isOpen,
  onClose,
  trustUnit,
  currentMemberCode,
  onConnect,
  onWait
}: TrustUnitModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible || !trustUnit) return null;

  const currentMember = trustUnit.members.find(m => m.memberCode === currentMemberCode);
  const otherMembers = trustUnit.members.filter(m => m.memberCode !== currentMemberCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                👑 Trust Unit Opportunity
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Each of you is connected by invitation, indicate your choice to connect on your profile pic
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close Trust Unit modal"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Sponsor Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👑</span>
              <div>
                <p className="font-medium text-blue-800">Sponsor: {trustUnit.sponsorName}</p>
                <p className="text-sm text-blue-600">Trust Unit Members</p>
              </div>
            </div>
          </div>

          {/* Trust Unit Members */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 mb-2">Trust Unit Members:</h4>
            
            {/* Current Member */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">💎</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{currentMember?.name}</p>
                  <p className="text-sm text-slate-600">You</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onConnect(currentMemberCode)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
                >
                  Connect
                </button>
                <button
                  onClick={() => onWait(currentMemberCode)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors"
                >
                  Wait
                </button>
              </div>
            </div>

            {/* Other Members */}
            {otherMembers.map((member, index) => (
              <div key={member.memberCode} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">💎</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="text-sm text-slate-600">
                      {member.status === 'pending_connection' ? 'Waiting for connection' : 
                       member.status === 'connected' ? 'Connected' : 'Waiting'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {member.status === 'pending_connection' ? 'â³' : 
                   member.status === 'connected' ? 'âœ…' : 'â¸ï¸'}
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Instructions:</strong> Click "Connect" to join the Trust Unit, or "Wait" to defer your decision. 
              All members must connect for the Trust Unit to be fully established.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




