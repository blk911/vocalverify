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
  sponsorCode?: string;
  rootSponsorId?: string;
  members: TrustUnitMember[];
  status: string;
  createdAt: string;
  type?: 'same_sponsor' | 'triangle_close';
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
  // ✅ DEDUPLICATE members to prevent React key errors
  const allMembers = trustUnit.members.filter((member, index, self) => 
    index === self.findIndex(m => m.memberCode === member.memberCode)
  );

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
                {trustUnit.type === 'triangle_close' && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-300">
                    🔺 Triangle Close
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {trustUnit.type === 'triangle_close' 
                  ? 'You share a common root sponsor and have formed a connection triangle'
                  : 'Each of you is connected by invitation, indicate your choice to connect on your profile pic'}
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
          {/* Trust Unit Members - All Three Equally */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 mb-2">Trust Unit Members:</h4>
            
            {/* All Members - Equal Display */}
            {allMembers.map((member, index) => {
              const isCurrentUser = member.memberCode === currentMemberCode;
              return (
                <div key={member.memberCode} className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentUser 
                    ? 'bg-blue-50 border-2 border-blue-300' 
                    : 'bg-slate-50 border border-slate-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {member.profilePicture ? (
                      <img 
                        src={member.profilePicture} 
                        alt={member.name}
                        className={`w-10 h-10 rounded-full object-cover border-2 ${
                          isCurrentUser ? 'border-blue-400' : 'border-slate-300'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isCurrentUser ? 'bg-blue-100 border-blue-400' : 'bg-slate-100 border-slate-300'
                      }`}>
                        <span className="text-lg">💎</span>
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isCurrentUser ? 'text-slate-900' : 'text-slate-800'}`}>
                        {member.name}
                      </p>
                      <p className={`text-xs ${isCurrentUser ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                        {isCurrentUser ? 'You' : 
                         member.status === 'pending_connection' ? 'Pending connection' : 
                         member.status === 'connected' ? 'Connected' : 
                         member.status === 'waiting' ? 'Waiting' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons or Status */}
                  {isCurrentUser ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onConnect(currentMemberCode)}
                        className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
                      >
                        Connect
                      </button>
                      <button
                        onClick={() => onWait(currentMemberCode)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
                      >
                        Wait
                      </button>
                    </div>
                  ) : (
                    <div>
                      {member.status === 'pending_connection' && (
                        <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                          ⏳ Pending
                        </span>
                      )}
                      {member.status === 'connected' && (
                        <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                          ✅ Connected
                        </span>
                      )}
                      {member.status === 'waiting' && (
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-300">
                          ⏸️ Waiting
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
