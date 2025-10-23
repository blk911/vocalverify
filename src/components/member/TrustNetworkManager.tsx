'use client';
import { useState, useEffect, useCallback } from 'react';

interface TrustBond {
  id: string;
  fromMemberCode: string;
  toMemberCode: string;
  fromMemberName: string;
  toMemberName: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: any;
}

interface TrustUnitMember {
  memberCode: string;
  name: string;
  status: string;
  profilePicture: string | null;
  hasVoice: boolean;
  connectionStatus: 'self' | 'direct' | 'indirect';
}

interface TrustNetworkManagerProps {
  memberCode: string;
}

export default function TrustNetworkManager({
  memberCode,
}: TrustNetworkManagerProps) {
  const [trustStatus, setTrustStatus] = useState<any>(null);
  const [trustMembers, setTrustMembers] = useState<TrustUnitMember[]>([]);
  const [trustBonds, setTrustBonds] = useState<TrustBond[]>([]);
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateBond, setShowCreateBond] = useState(false);
  const [targetMemberCode, setTargetMemberCode] = useState('');
  const [bondMessage, setBondMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [isEditingTUName, setIsEditingTUName] = useState(false);
  const [tuNameInput, setTuNameInput] = useState('');
  const [updatingTUName, setUpdatingTUName] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const loadTrustData = useCallback(async () => {
    setLoading(true);
    try {
      // Load trust unit status
      const statusResponse = await fetch(
        `/api/trust/units/status?memberCode=${memberCode}`
      );
      const statusData = await statusResponse.json();
      if (statusData.ok) {
        setTrustStatus(statusData);
      }

      // Load trust unit members
      const membersResponse = await fetch(
        `/api/trust/units/members?memberCode=${memberCode}`
      );
      const membersData = await membersResponse.json();
      if (membersData.ok) {
        setTrustMembers(membersData.members || []);
      }

      // Load trust bonds
      const bondsResponse = await fetch(
        `/api/trust-bonds/list?memberCode=${memberCode}`
      );
      const bondsData = await bondsResponse.json();
      if (bondsData.ok) {
        setTrustBonds(bondsData.trustBonds || []);
      }

      // Load member data (for sponsor info)
      const memberResponse = await fetch(
        `/api/user/profile?memberCode=${memberCode}`
      );
      const memberData = await memberResponse.json();
      if (memberData.ok) {
        setMemberData(memberData.member);
      }
    } catch (error) {
      console.error('Error loading trust data:', error);
    } finally {
      setLoading(false);
    }
  }, [memberCode]);

  useEffect(() => {
    if (memberCode) {
      loadTrustData();
    }
  }, [memberCode, loadTrustData]);

  const handleCreateBond = async () => {
    if (!targetMemberCode.trim()) {
      showNotification('error', 'Please enter a member code');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/trust/bonds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromMemberCode: memberCode,
          toMemberCode: targetMemberCode.trim(),
          message: bondMessage || "Let's connect on AM I HUMAN!",
        }),
      });

      const data = await response.json();
      if (data.ok) {
        showNotification('success', 'Trust bond request sent successfully!');
        setTargetMemberCode('');
        setBondMessage('');
        setShowCreateBond(false);
        loadTrustData();
      } else {
        showNotification('error', 'Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating bond:', error);
      showNotification('error', 'Failed to create trust bond');
    } finally {
      setCreating(false);
    }
  };

  const handleEditTUName = () => {
    setIsEditingTUName(true);
    setTuNameInput(trustStatus?.trustUnit?.tuName || '');
  };

  const handleCancelEditTUName = () => {
    setIsEditingTUName(false);
    setTuNameInput('');
  };

  const handleSaveTUName = async () => {
    if (!tuNameInput.trim()) {
      showNotification('error', 'Please enter a TU name');
      return;
    }

    if (!trustStatus?.trustUnit?.id) {
      showNotification('error', 'No Trust Unit found');
      return;
    }

    setUpdatingTUName(true);
    try {
      const response = await fetch('/api/trust-units/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: trustStatus.trustUnit.id,
          tuName: tuNameInput.trim(),
          memberCode: memberCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setTrustStatus((prev: any) => ({
          ...prev,
          trustUnit: {
            ...prev.trustUnit,
            tuName: tuNameInput.trim(),
          },
        }));
        setIsEditingTUName(false);
        setTuNameInput('');
        showNotification('success', 'Trust Unit name updated successfully!');
      } else {
        showNotification('error', 'Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating TU name:', error);
      showNotification('error', 'Failed to update Trust Unit name');
    } finally {
      setUpdatingTUName(false);
    }
  };

  const handleMemberClick = async (
    memberCode: string,
    memberName: string,
    isSponsor: boolean = false
  ) => {
    try {
      // Fetch full member details
      const response = await fetch(
        `/api/user/profile?memberCode=${memberCode}`
      );
      const data = await response.json();

      if (data.ok) {
        setSelectedMember({
          ...data.member,
          isSponsor,
          displayName: memberName,
        });
        setShowMemberModal(true);
      } else {
        showNotification('error', 'Failed to load member details');
      }
    } catch (error) {
      console.error('Error loading member details:', error);
      showNotification('error', 'Failed to load member details');
    }
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
  };

  const showNotification = (
    type: 'success' | 'error' | 'info',
    message: string
  ) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='h-32 bg-gray-200 rounded mb-4'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Networks Header */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-2xl font-bold text-gray-800'>NETWORKS</h2>
          <div className='text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full'>
            🌐 Network
          </div>
        </div>
      </div>

      {/* Trust Bonds */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h2 className='text-xl font-bold text-gray-800 mb-4'>
          Trust Bonds ({trustBonds.length})
        </h2>

        {trustBonds.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>No trust bonds yet.</p>
            <p className='text-sm mt-2'>
              Create connections to build your trust network!
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {trustBonds.map(bond => (
              <div
                key={bond.id}
                className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold'>
                    {bond.fromMemberCode === memberCode
                      ? bond.toMemberName.charAt(0).toUpperCase()
                      : bond.fromMemberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='font-medium text-gray-800'>
                      {bond.fromMemberCode === memberCode
                        ? bond.toMemberName
                        : bond.fromMemberName}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {bond.fromMemberCode === memberCode
                        ? bond.toMemberCode
                        : bond.fromMemberCode}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bond.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : bond.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bond.status === 'accepted'
                      ? '✅ Connected'
                      : bond.status === 'pending'
                        ? '⏳ Pending'
                        : '❌ Rejected'}
                  </span>

                  {bond.status === 'accepted' && (
                    <span className='text-xs text-gray-500'>
                      {bond.createdAt
                        ? new Date(
                            bond.createdAt._seconds
                              ? bond.createdAt._seconds * 1000
                              : bond.createdAt
                          ).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Units */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <h2 className='text-xl font-bold text-gray-800 mb-6'>
          Trust Units ({trustStatus?.trustUnit ? 1 : 0})
        </h2>

        {/* Individual TU Section */}
        {trustStatus?.trustUnit && (
          <div className='mb-6'>
            {/* TU Header with Name Editing */}
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-700'>
                {trustStatus.trustUnit.tuName || 'Unnamed Trust Unit'}
              </h3>
              <div className='flex items-center space-x-2'>
                {isEditingTUName ? (
                  <div className='flex items-center space-x-2'>
                    <input
                      type='text'
                      value={tuNameInput}
                      onChange={e => setTuNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSaveTUName();
                        } else if (e.key === 'Escape') {
                          handleCancelEditTUName();
                        }
                      }}
                      className='text-sm px-3 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter TU name...'
                      maxLength={50}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTUName}
                      disabled={updatingTUName}
                      className='text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-full disabled:opacity-50'
                    >
                      {updatingTUName ? 'Saving...' : '✓'}
                    </button>
                    <button
                      onClick={handleCancelEditTUName}
                      className='text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-full'
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditTUName}
                    className='text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full'
                    title='Edit TU name'
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>

            {/* Members Sub-header */}
            <h4 className='text-sm font-medium text-gray-600 mb-4'>
              Members ({trustMembers.length})
            </h4>

            {/* Member Tiles */}
            {trustMembers.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <p>No members in this trust unit yet.</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Show sponsor first if available - get from Trust Unit data */}
                {trustStatus?.trustUnit?.sponsorCode &&
                  trustStatus.trustUnit.sponsorCode !== '0000000000' && (
                    <div className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-purple-50'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden'>
                          {trustStatus.trustUnit.sponsorProfilePicture ? (
                            <img
                              src={trustStatus.trustUnit.sponsorProfilePicture}
                              alt={
                                trustStatus.trustUnit.sponsorName || 'Sponsor'
                              }
                              className='w-full h-full object-cover rounded-full'
                              onError={e => {
                                // Fallback to crown if image fails to load
                                e.currentTarget.style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display =
                                  'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center ${trustStatus.trustUnit.sponsorProfilePicture ? 'hidden' : 'flex'}`}
                          >
                            👑
                          </div>
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2'>
                            <h3 className='font-semibold text-gray-800'>
                              {trustStatus.trustUnit.sponsorName || 'Sponsor'}
                            </h3>
                            <button
                              onClick={() =>
                                handleMemberClick(
                                  trustStatus.trustUnit.sponsorCode,
                                  trustStatus.trustUnit.sponsorName,
                                  true
                                )
                              }
                              className='px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer'
                            >
                              👑 Sponsor
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Show other trust unit members (excluding sponsor) */}
                {trustMembers
                  .filter(
                    member =>
                      member.memberCode !== trustStatus?.trustUnit?.sponsorCode
                  )
                  .map(member => (
                    <div
                      key={member.memberCode}
                      className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-center space-x-3'>
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.name}
                            className='w-12 h-12 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg'>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2'>
                            <h3 className='font-semibold text-gray-800'>
                              {member.name}
                            </h3>
                            <button
                              onClick={() =>
                                handleMemberClick(
                                  member.memberCode,
                                  member.name,
                                  false
                                )
                              }
                              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                member.connectionStatus === 'self'
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  : member.connectionStatus === 'direct'
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              {member.connectionStatus === 'self'
                                ? '👤 You'
                                : member.connectionStatus === 'direct'
                                  ? '🔗 Direct'
                                  : '🌐 Indirect'}
                            </button>
                          </div>
                          {member.hasVoice && (
                            <span className='text-green-600 text-xs'>
                              🎤 Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* No Trust Units Message */}
        {!trustStatus?.trustUnit && (
          <div className='text-center py-8 text-gray-500'>
            <p>You're not part of any trust units yet.</p>
            <p className='text-sm mt-2'>
              Create trust bonds to start building your network!
            </p>
          </div>
        )}
      </div>

      {/* Member Preview Modal */}
      {showMemberModal && selectedMember && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
            {/* Modal Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Member Details
              </h3>
              <button
                onClick={closeMemberModal}
                className='text-gray-400 hover:text-gray-600 transition-colors'
                title='Close modal'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className='p-6'>
              <div className='flex flex-col items-center space-y-4'>
                {/* Profile Picture */}
                <div className='w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl'>
                  {selectedMember.profilePicture ? (
                    <img
                      src={selectedMember.profilePicture}
                      alt={selectedMember.displayName || selectedMember.name}
                      className='w-20 h-20 rounded-full object-cover'
                    />
                  ) : selectedMember.isSponsor ? (
                    '👑'
                  ) : (
                    (selectedMember.displayName || selectedMember.name || 'M')
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                {/* Name */}
                <div className='text-center'>
                  <h4 className='text-xl font-semibold text-gray-800'>
                    {selectedMember.displayName ||
                      selectedMember.name ||
                      'Unknown Member'}
                  </h4>
                  {selectedMember.isSponsor && (
                    <span className='inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2'>
                      👑 Sponsor
                    </span>
                  )}
                </div>

                {/* Member Code */}
                <div className='text-center'>
                  <p className='text-sm text-gray-500'>Member Code</p>
                  <p className='text-lg font-mono text-gray-800'>
                    {selectedMember.memberCode}
                  </p>
                </div>

                {/* Contact Information */}
                <div className='w-full space-y-3'>
                  {/* Email */}
                  {selectedMember.email && (
                    <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                      <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                        <svg
                          className='w-4 h-4 text-blue-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Email</p>
                        <p className='text-sm font-medium text-gray-800'>
                          {selectedMember.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {selectedMember.phone && (
                    <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                      <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
                        <svg
                          className='w-4 h-4 text-green-600'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='text-sm text-gray-500'>Phone</p>
                        <p className='text-sm font-medium text-gray-800'>
                          {selectedMember.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sponsor */}
                  {selectedMember.sponsorName &&
                    selectedMember.sponsorId !== '0000000000' && (
                      <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
                        <div className='w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center'>
                          <span className='text-purple-600 text-sm'>👑</span>
                        </div>
                        <div>
                          <p className='text-sm text-gray-500'>Sponsor</p>
                          <p className='text-sm font-medium text-gray-800'>
                            {selectedMember.sponsorName}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {selectedMember.sponsorId}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='flex justify-end p-6 border-t border-gray-200'>
              <button
                onClick={closeMemberModal}
                className='px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className='fixed top-4 right-4 z-50'>
          <div
            className={`px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
            }`}
          >
            <div className='flex items-center space-x-2'>
              <span className='text-lg'>
                {notification.type === 'success'
                  ? '✅'
                  : notification.type === 'error'
                    ? '❌'
                    : 'ℹ️'}
              </span>
              <span className='font-medium'>{notification.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
