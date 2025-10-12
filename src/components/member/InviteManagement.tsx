"use client";
import { useState, useEffect } from 'react';

interface InviteManagementProps {
  memberName: string;
  memberCode: string;
}

export default function InviteManagement({ memberName, memberCode }: InviteManagementProps) {
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteHistory, setInviteHistory] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadInviteHistory();
  }, []);

  const loadInviteHistory = async () => {
    try {
      const response = await fetch(`/api/member/invite-history?memberCode=${memberCode}`);
      const data = await response.json();
      if (data.ok) {
        setInviteHistory(data.invites);
      }
    } catch (error) {
      console.error('Load invite history error:', error);
    }
  };

  const handleInviteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format phone number as (000) 000-0000
      const phoneDigits = value.replace(/\D/g, '').slice(0, 10);
      let formattedPhone = phoneDigits;
      
      if (phoneDigits.length >= 6) {
        formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
      } else if (phoneDigits.length >= 3) {
        formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3)}`;
      } else if (phoneDigits.length > 0) {
        formattedPhone = `(${phoneDigits}`;
      }
      
      setInviteForm(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setInviteForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.phone) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    // Extract digits from formatted phone number
    const phoneDigits = inviteForm.phone.replace(/\D/g, '');
    
    // Validate phone format
    if (phoneDigits.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      setShowErrorModal(true);
      return;
    }

    setIsSendingInvite(true);

    try {
      const response = await fetch('/api/member/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          phone: phoneDigits,
          sponsorId: memberCode,
          sponsorName: memberName
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage(`Invitation sent successfully to ${inviteForm.firstName} ${inviteForm.lastName}!`);
        setShowSuccessModal(true);
        setInviteForm({ firstName: '', lastName: '', phone: '' });
        loadInviteHistory();
      } else {
        setErrorMessage(data.error || 'Failed to send invitation');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Send invitation error:', error);
      setErrorMessage('Failed to send invitation. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Invite Management</h2>
      
      {/* Send Invitation */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Send Invitation</h3>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={inviteForm.firstName}
                  onChange={handleInviteFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={inviteForm.lastName}
                  onChange={handleInviteFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={inviteForm.phone}
                onChange={handleInviteFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
                maxLength={14}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: (555) 123-4567</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Invitation Message Preview:</h4>
              <div className="text-sm text-yellow-700 bg-white p-3 rounded border">
                <p><strong>Hello {inviteForm.firstName || '[First]'}!</strong></p>
                <p>Am I Human?? Great question huh! Truth: I want to connect to the people I love. That's you! This is a private space, no ads, no bots, no censorship...just people I love!! Check it out and join me!!</p>
                <p>Talk soon,<br/><strong>{memberName}</strong></p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingInvite}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSendingInvite ? 'â³ Sending...' : 'ðŸ“¨ Send Invitation'}
            </button>
          </form>
        </div>
      </div>

      {/* Member Invites */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{memberName} Invites</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {inviteHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-slate-600">No invitations sent yet.</p>
              <p className="text-sm text-slate-500 mt-2">Your invitation history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inviteHistory.map((invite, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">
                            {invite.firstName?.charAt(0)}{invite.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{invite.name}</h4>
                          <p className="text-sm text-gray-500">{invite.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>📅 {new Date(invite.invitedAt).toLocaleDateString()}</span>
                        <span>👤 Sponsor: {invite.sponsorName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invite.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {invite.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
              <p className="text-sm text-gray-500 mb-4">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-2xl">âŒ</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-sm text-gray-500 mb-4">{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




