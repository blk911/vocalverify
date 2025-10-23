'use client';

import { useState } from 'react';

interface VaultContentProps {
  selectedVault?: any;
  vaultMessages?: any[];
  trustBonds?: any[];
  trustUnits?: any[];
  onVaultAction?: (action: string, data?: any) => void;
}

export default function VaultContent({
  selectedVault,
  vaultMessages = [],
  trustBonds = [],
  trustUnits = [],
  onVaultAction,
}: VaultContentProps) {
  const [activeTab, setActiveTab] = useState('files');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // DEBUG: Log selectedVault state
  console.log('🔥 [VAULT-CONTENT] selectedVault:', selectedVault);
  console.log('🔥 [VAULT-CONTENT] vaultMessages:', vaultMessages?.length || 0);

  const tabs = [
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // REAL Trust Bonds and Trust Units from database - passed from parent
  // trustBonds and trustUnits are now passed as props

  const mockFiles = [
    {
      id: '1',
      name: 'document.pdf',
      size: '2.3 MB',
      type: 'pdf',
      uploaded: '2 hours ago',
    },
    {
      id: '2',
      name: 'photo.jpg',
      size: '1.8 MB',
      type: 'image',
      uploaded: '1 day ago',
    },
    {
      id: '3',
      name: 'video.mp4',
      size: '45.2 MB',
      type: 'video',
      uploaded: '3 days ago',
    },
  ];

  // REAL conversation messages from database - passed from parent component
  const getMessagesForVault = (vault: any) => {
    // Return real messages from database
    return vaultMessages || [];
  };

  const mockMessages = getMessagesForVault(selectedVault);

  // REAL members from database - based on selected vault
  const getMembersForVault = (vault: any) => {
    if (vault?.type === 'bond') {
      // Trust Bond: Show the two partners
      return [
        {
          id: vault.fromMemberCode || '1',
          name: vault.fromMemberName || 'You',
          role: 'Partner',
          status: 'online',
          avatar: '👤',
        },
        {
          id: vault.toMemberCode || '2',
          name: vault.toMemberName || vault.partner,
          role: 'Partner',
          status: 'online',
          avatar: '👑',
        },
      ];
    } else if (vault?.type === 'unit') {
      // Trust Unit: Show all members
      const members = vault.members || [];
      return members.map((member: any, index: number) => ({
        id: member.memberCode || `member-${index}`,
        name: member.memberName || member.name,
        role: member.role || (index === 0 ? 'Owner' : 'Member'),
        status: 'online',
        avatar: index === 0 ? '👑' : '👤',
      }));
    }
    return [];
  };

  const mockMembers = getMembersForVault(selectedVault);

  // REAL message sending to database
  const sendMessage = async (messageText: string) => {
    if (!selectedVault || !messageText.trim()) return;

    try {
      const response = await fetch('/api/vaults/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId: selectedVault.vaultId,
          message: messageText.trim(),
          vaultType: selectedVault.type,
        }),
      });

      if (response.ok) {
        console.log('✅ Message sent to database');
        // Message will be loaded via existing vault message system
      } else {
        console.error('❌ Failed to send message:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const renderFiles = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-800'>Files</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
        >
          📤 Upload File
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {mockFiles.map(file => (
          <div
            key={file.id}
            className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
          >
            <div className='flex items-center space-x-3'>
              <div className='text-2xl'>
                {file.type === 'pdf'
                  ? '📄'
                  : file.type === 'image'
                    ? '🖼️'
                    : '🎥'}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-900 truncate'>
                  {file.name}
                </p>
                <p className='text-xs text-gray-500'>
                  {file.size} • {file.uploaded}
                </p>
              </div>
            </div>
            <div className='mt-3 flex space-x-2'>
              <button className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'>
                📥 Download
              </button>
              <button className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'>
                🔗 Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-800'>Messages</h3>
        <button className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'>
          ✏️ New Message
        </button>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto'>
        <div className='space-y-4'>
          {mockMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.author === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.author === 'You'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className='text-sm font-medium'>{msg.author}</p>
                <p className='text-sm'>{msg.message}</p>
                <p className='text-xs opacity-75 mt-1'>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-800'>Members</h3>
        <button className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors'>
          👥 Invite Member
        </button>
      </div>

      <div className='space-y-3'>
        {mockMembers.map((member: any) => (
          <div
            key={member.id}
            className='flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold'>
                {member.avatar}
              </div>
              <div>
                <p className='font-medium text-gray-900'>{member.name}</p>
                <p className='text-sm text-gray-500'>{member.role}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-2 h-2 rounded-full ${
                  member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></span>
              <span className='text-sm text-gray-500'>{member.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className='space-y-6'>
      <h3 className='text-lg font-semibold text-gray-800'>Vault Settings</h3>

      <div className='space-y-4'>
        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-2'>Vault Name</h4>
          <input
            type='text'
            defaultValue={selectedVault?.name || 'My Vault'}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label='Vault name'
            title='Enter vault name'
          />
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-2'>Privacy Settings</h4>
          <div className='space-y-2'>
            <label className='flex items-center'>
              <input
                type='radio'
                name='privacy'
                value='private'
                defaultChecked
                className='mr-2'
              />
              <span className='text-sm'>Private - Only members can access</span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                name='privacy'
                value='shared'
                className='mr-2'
              />
              <span className='text-sm'>
                Shared - Invited members can access
              </span>
            </label>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-lg p-4'>
          <h4 className='font-medium text-gray-900 mb-2'>Storage</h4>
          <div className='text-sm text-gray-600'>
            <p>Used: 2.3 GB of 10 GB</p>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div className='bg-blue-600 h-2 rounded-full w-[23%]'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return renderFiles();
      case 'messages':
        return renderMessages();
      case 'members':
        return renderMembers();
      case 'settings':
        return renderSettings();
      default:
        return renderFiles();
    }
  };

  if (!selectedVault) {
    return (
      <div className='flex-1 bg-gray-50'>
        <div className='p-6'>
          <h2 className='text-2xl font-bold text-gray-800 mb-6'>
            Vaults Overview
          </h2>

          {/* Trust Bonds Section - Simple Summary */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold text-gray-700 mb-3 flex items-center'>
              <span className='text-xl mr-2'>🤝</span>
              Trust Bonds ({trustBonds.length})
            </h3>
            <div className='space-y-2'>
              {trustBonds.map(bond => (
                <div
                  key={bond.id}
                  onClick={() => {
                    console.log('Opening Trust Bond conversation:', bond);
                    // This would trigger opening the TB conversation
                  }}
                  className='bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='text-lg'>🤝</div>
                      <div>
                        <span className='font-medium text-gray-800'>
                          {bond.fromMemberName} ↔ {bond.toMemberName}
                        </span>
                        <span className='text-sm text-gray-500 ml-2'>
                          • {bond.status}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-500'>
                        {bond.createdAt
                          ? new Date(bond.createdAt).toLocaleDateString()
                          : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Units Section - Simple Summary */}
          <div>
            <h3 className='text-lg font-semibold text-gray-700 mb-3 flex items-center'>
              <span className='text-xl mr-2'>🌐</span>
              Trust Units ({trustUnits.length})
            </h3>
            <div className='space-y-2'>
              {trustUnits.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => {
                    console.log('Opening Trust Unit conversation:', unit);
                    // This would trigger opening the TU conversation
                  }}
                  className='bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='text-lg'>🌐</div>
                      <div>
                        <span className='font-medium text-gray-800'>
                          {unit.tuName || unit.name}
                        </span>
                        <span className='text-sm text-gray-500 ml-2'>
                          • {unit.members?.length || 0} members
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-500'>
                        {unit.createdAt
                          ? new Date(unit.createdAt).toLocaleDateString()
                          : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 bg-gray-50'>
      {/* Vault Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              {selectedVault.type === 'bond'
                ? `Trust Bond with ${selectedVault.partner}`
                : selectedVault.type === 'unit'
                  ? `Trust Unit: ${selectedVault.tuName}`
                  : selectedVault.name}
            </h1>
            <p className='text-gray-600'>
              {selectedVault.type === 'bond' && 'Secure 1-on-1 communication'}
              {selectedVault.type === 'unit' &&
                `Group communication with ${selectedVault.members?.length || 0} members`}
              {selectedVault.type === 'personal' && 'Personal Vault'}
            </p>
          </div>
        </div>
      </div>

      {/* Vault Conversation Area - This is the social media posting interface */}
      <div className='flex-1 p-6 bg-gray-50'>
        <div className='max-w-4xl mx-auto'>
          {/* Messages Area */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 mb-4'>
            <div className='p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Conversation
              </h3>
            </div>
            <div className='p-4 max-h-96 overflow-y-auto'>
              {mockMessages.map(message => (
                <div key={message.id} className='mb-4'>
                  <div className='flex items-start space-x-3'>
                    <div className='w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium'>
                      {message.author.charAt(0)}
                    </div>
                    <div className='flex-1'>
                      <div className='bg-gray-100 rounded-lg p-3'>
                        <p className='text-sm font-medium text-gray-800'>
                          {message.author}
                        </p>
                        <p className='text-gray-700'>{message.message}</p>
                        <p className='text-xs text-gray-500 mt-1'>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input Area - Social Media Posting Interface */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='p-4'>
              <div className='flex space-x-3'>
                <div className='w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium'>
                  Y
                </div>
                <div className='flex-1'>
                  <textarea
                    placeholder='Type your message...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
                    rows={3}
                  />
                </div>
              </div>
              <div className='flex items-center justify-between mt-3'>
                <div className='flex items-center space-x-4'>
                  <button className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600'>
                    <span>📎</span>
                    <span className='text-sm'>Attach</span>
                  </button>
                  <button className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600'>
                    <span>📷</span>
                    <span className='text-sm'>Photo</span>
                  </button>
                  <button className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600'>
                    <span>🎤</span>
                    <span className='text-sm'>Voice</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    const textarea = document.querySelector(
                      'textarea'
                    ) as HTMLTextAreaElement;
                    if (textarea?.value) {
                      sendMessage(textarea.value);
                      textarea.value = ''; // Clear input
                    }
                  }}
                  className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Upload File
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className='text-gray-400 hover:text-gray-600 text-xl'
              >
                ✕
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  File
                </label>
                <input
                  type='file'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Upload file'
                  title='Select file to upload'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Add a description...'
                  aria-label='File description'
                />
              </div>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                >
                  Cancel
                </button>
                <button className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
