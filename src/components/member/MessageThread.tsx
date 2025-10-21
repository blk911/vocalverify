'use client';

import { useState, useEffect, useRef } from 'react';

interface MessageThreadProps {
  selectedVault?: any;
  vaultMessages?: any[];
  trustBonds?: any[];
  trustUnits?: any[];
  onVaultAction?: (action: string, data?: any) => void;
}

export default function MessageThread({
  selectedVault,
  vaultMessages = [],
  trustBonds = [],
  trustUnits = [],
  onVaultAction,
}: MessageThreadProps) {
  const [activeTab, setActiveTab] = useState('messages');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [vaultMessages]);

  // Get members for current vault
  const getMembersForVault = (vault: any) => {
    if (vault?.type === 'bond') {
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

  const members = getMembersForVault(selectedVault);

  // Send message to database
  const sendMessage = async (messageText: string) => {
    if (!selectedVault || !messageText.trim()) return;

    const vaultId = selectedVault.vaultId || selectedVault.id;
    console.log('🔥 [MESSAGE] Sending message to vault:', vaultId);

    try {
      const response = await fetch(`/api/vaults/${vaultId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageText.trim(),
          senderId: 'SPENW', // Current user
          messageType: 'text',
        }),
      });

      if (response.ok) {
        console.log('✅ Message sent to database');
        setNewMessage('');
        // Trigger refresh of messages
        onVaultAction?.('refresh-messages');
      } else {
        console.error('❌ Failed to send message:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newText: string) => {
    const vaultId = selectedVault.vaultId || selectedVault.id;
    try {
      const response = await fetch(
        `/api/vaults/${vaultId}/messages/${messageId}/edit`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newText.trim(),
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Message edited');
        setEditingMessage(null);
        setEditText('');
        onVaultAction?.('refresh-messages');
      } else {
        console.error('❌ Failed to edit message:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    const vaultId = selectedVault.vaultId || selectedVault.id;
    try {
      const response = await fetch(
        `/api/vaults/${vaultId}/messages/${messageId}/delete`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        console.log('✅ Message deleted');
        onVaultAction?.('refresh-messages');
      } else {
        console.error('❌ Failed to delete message:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
  };

  // Like message
  const likeMessage = async (messageId: string) => {
    const vaultId = selectedVault.vaultId || selectedVault.id;
    try {
      const response = await fetch(
        `/api/vaults/${vaultId}/messages/${messageId}/react`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reaction: 'like',
            userId: 'SPENW',
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Message liked');
        onVaultAction?.('refresh-messages');
      }
    } catch (error) {
      console.error('❌ Error liking message:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim() && editingMessage) {
      editMessage(editingMessage.id, editText);
    }
  };

  return (
    <div className='w-full bg-gray-50'>
      {/* Vault Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>
              {!selectedVault
                ? 'SELECT NAME, START A CONVO'
                : selectedVault?.type === 'bond'
                  ? `Trust Bond with ${selectedVault.toMemberName || selectedVault.partner}`
                  : selectedVault?.type === 'unit'
                    ? `Trust Unit: ${selectedVault.tuName || selectedVault.name}`
                    : selectedVault?.name || 'Vault Conversation'}
            </h1>
            <p className='text-gray-600'>
              {!selectedVault &&
                'Choose a Trust Bond or Trust Unit from the sidebar to begin conversation'}
              {selectedVault?.type === 'bond' && 'Secure 1-on-1 communication'}
              {selectedVault?.type === 'unit' &&
                `Group communication with ${members.length} members`}
              {selectedVault?.type === 'personal' && 'Personal Vault'}
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-sm text-gray-500'>
              {members.length} member{members.length !== 1 ? 's' : ''} online
            </div>
            <div className='flex -space-x-2'>
              {members.slice(0, 3).map((member, index) => (
                <div
                  key={member.id}
                  className='w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium border-2 border-white'
                >
                  {member.avatar}
                </div>
              ))}
              {members.length > 3 && (
                <div className='w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white'>
                  +{members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className='w-full bg-gray-50'>
        <div className='w-full'>
          {/* Messages Area */}
          <div className='bg-white shadow-sm border border-gray-200 mb-4'>
            <div className='p-4 border-b border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-800'>
                Live Conversation
              </h3>
            </div>
            <div className='p-4 max-h-96 overflow-y-auto'>
              {vaultMessages.length > 0 ? (
                vaultMessages.map(message => (
                  <div key={message.id} className='mb-4'>
                    <div className='flex items-start space-x-3'>
                      <div className='w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium'>
                        {message.senderDetails?.name?.charAt(0) ||
                          message.author?.charAt(0) ||
                          'U'}
                      </div>
                      <div className='flex-1'>
                        <div className='bg-gray-100 rounded-lg p-3'>
                          <div className='flex items-center justify-between mb-1'>
                            <p className='text-sm font-medium text-gray-800'>
                              {message.senderDetails?.name ||
                                message.author ||
                                'Unknown'}
                            </p>
                            <div className='flex items-center space-x-2'>
                              <span className='text-xs text-gray-500'>
                                {new Date(
                                  message.createdAt
                                ).toLocaleTimeString()}
                              </span>
                              <button
                                onClick={() => likeMessage(message.id)}
                                className='text-gray-400 hover:text-red-500 transition-colors'
                                title='Like message'
                              >
                                ❤️
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(message);
                                  setEditText(message.content);
                                }}
                                className='text-gray-400 hover:text-blue-500 transition-colors'
                                title='Edit message'
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className='text-gray-400 hover:text-red-500 transition-colors'
                                title='Delete message'
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className='text-gray-700'>{message.content}</p>
                          {message.reactions &&
                            Object.keys(message.reactions).length > 0 && (
                              <div className='flex items-center space-x-2 mt-2'>
                                {Object.entries(message.reactions).map(
                                  ([reaction, count]) => (
                                    <span
                                      key={reaction}
                                      className='text-xs bg-gray-200 px-2 py-1 rounded-full'
                                    >
                                      {reaction} {count}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <span className='text-4xl mb-2 block'>💬</span>
                  <p>No messages yet</p>
                  <p className='text-sm'>Start the conversation below</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input Area - Social Media Posting Interface */}
          <div className='bg-white shadow-sm border border-gray-200'>
            <div className='p-4'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='flex items-start space-x-3'>
                  <div className='w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium'>
                    S
                  </div>
                  <div className='flex-1'>
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="What's on your mind? Share with your vault..."
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
                      rows={3}
                      aria-label='Message input'
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors'
                      title='Attach file'
                    >
                      <span>📎</span>
                      <span className='text-sm'>Attach</span>
                    </button>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors'
                      title='Add photo'
                    >
                      <span>📷</span>
                      <span className='text-sm'>Photo</span>
                    </button>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors'
                      title='Record voice'
                    >
                      <span>🎤</span>
                      <span className='text-sm'>Voice</span>
                    </button>
                    <button
                      type='button'
                      className='flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors'
                      title='Add video'
                    >
                      <span>🎬</span>
                      <span className='text-sm'>Video</span>
                    </button>
                  </div>
                  <button
                    type='submit'
                    disabled={!newMessage.trim()}
                    className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Edit Message Modal */}
          {editingMessage && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
              <div className='bg-white rounded-xl p-6 max-w-md w-full mx-4'>
                <h3 className='text-xl font-bold text-gray-800 mb-4'>
                  Edit Message
                </h3>
                <form onSubmit={handleEditSubmit} className='space-y-4'>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
                    rows={3}
                    aria-label='Edit message'
                  />
                  <div className='flex items-center justify-end space-x-3'>
                    <button
                      type='button'
                      onClick={() => {
                        setEditingMessage(null);
                        setEditText('');
                      }}
                      className='px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={!editText.trim()}
                      className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50'
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
