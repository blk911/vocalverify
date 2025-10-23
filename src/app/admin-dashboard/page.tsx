'use client';
import { useState, useEffect } from 'react';
import AdminTopbar from '@/components/admin/Topbar';
import AdminSidebar from '@/components/admin/Sidebar';
import {
  safeGet,
  safeUpperCase,
  safeArray,
  safeObject,
  logError,
} from '@/utils/errorHandling';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    totalMembers: 0,
    newToday: 0,
    pendingMembers: 0,
    registeredMembers: 0,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteForm, setInviteForm] = useState({
    name: '',
    phone: '',
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteHistory, setInviteHistory] = useState<any[]>([]);
  const [notFoundRegistry, setNotFoundRegistry] = useState<any[]>([]);
  const [nfArchive, setNfArchive] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load system stats
      const statsResponse = await fetch('/api/admin/stats');
      const statsData = await statsResponse.json();
      if (statsData.ok) {
        setStats(
          safeObject(statsData.stats, {
            totalMembers: 0,
            newToday: 0,
            pendingMembers: 0,
            registeredMembers: 0,
          })
        );
      }

      // Load members list
      const membersResponse = await fetch('/api/admin/members', {
        method: 'GET',
      });
      const membersData = await membersResponse.json();
      if (membersData.ok) {
        setMembers(safeArray(membersData.members));
      }

      // Load invite history
      const inviteResponse = await fetch('/api/admin/invite-history');
      const inviteData = await inviteResponse.json();
      if (inviteData.ok) {
        setInviteHistory(safeArray(inviteData.invites));
      }

      // Load not found registry
      const notFoundResponse = await fetch('/api/admin/not-found-registry');
      const notFoundData = await notFoundResponse.json();
      if (notFoundData.ok) {
        setNotFoundRegistry(safeArray(notFoundData.registry));
      }

      // Load NF Archive
      const archiveResponse = await fetch('/api/admin/nf-archive');
      const archiveData = await archiveResponse.json();
      if (archiveData.ok) {
        setNfArchive(safeArray(archiveData.archiveEntries));
      }
    } catch (error) {
      logError(error, 'loadDashboardData');
      // Set safe defaults on error
      setStats({
        totalMembers: 0,
        newToday: 0,
        pendingMembers: 0,
        registeredMembers: 0,
      });
      setMembers([]);
      setInviteHistory([]);
      setNotFoundRegistry([]);
      setNfArchive([]);
    }
  };

  const filteredMembers = (members || []).filter(
    member =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
  );

  const handleClearAll = () => {
    setShowClearAllModal(true);
  };

  const confirmClearAll = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/clear-all', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.ok) {
        setShowSuccessModal(true);
        setSuccessMessage(
          `Successfully cleared ${data.deletedMembers} members and ${data.deletedInvites} invites (${data.totalDeleted} total items)`
        );
        // Reload dashboard data
        loadDashboardData();
      } else {
        setShowErrorModal(true);
        setErrorMessage('Error clearing members: ' + data.error);
      }
    } catch (error) {
      setShowErrorModal(true);
      setErrorMessage('Error clearing members');
    } finally {
      setIsClearing(false);
      setShowClearAllModal(false);
    }
  };

  const handleDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      // Use memberCode instead of phone for the delete request
      const memberCode = memberToDelete.memberCode || memberToDelete.phone;
      console.log('Deleting member:', memberToDelete);
      console.log('Using memberCode:', memberCode);

      const response = await fetch(
        `/api/admin/delete-user?memberCode=${memberCode}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      console.log('Delete response:', data);

      if (data.ok) {
        setShowSuccessModal(true);
        setSuccessMessage(`${memberToDelete.name} has been deleted`);
        // Reload dashboard data
        loadDashboardData();
      } else {
        setShowErrorModal(true);
        setErrorMessage('Error deleting member: ' + data.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setShowErrorModal(true);
      setErrorMessage('Error deleting member: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setMemberToDelete(null);
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
        [name]: formattedPhone,
      }));
    } else {
      setInviteForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.name || !inviteForm.phone) {
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
      const response = await fetch('/api/admin/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inviteForm.name,
          phone: phoneDigits, // Send only digits to API
          sponsorId: '0000000000',
          sponsorName: 'Sys Admin',
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage(
          `Invitation sent successfully to ${inviteForm.name}!`
        );
        setShowSuccessModal(true);
        setInviteForm({ name: '', phone: '' });
        // Reload dashboard data to show updated stats
        loadDashboardData();
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

  const handleSetActive = async (invite: any) => {
    try {
      const response = await fetch('/api/admin/set-invite-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: invite.id,
          status: invite.status === 'active' ? 'sent' : 'active',
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage(
          `Invite status updated to ${invite.status === 'active' ? 'sent' : 'active'}`
        );
        setShowSuccessModal(true);
        loadDashboardData(); // Refresh invite history
      } else {
        setErrorMessage(data.error || 'Failed to update invite status');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to update invite status');
      setShowErrorModal(true);
    }
  };

  const handleDeleteInvite = async (invite: any) => {
    if (
      !confirm(
        `Are you sure you want to delete the invite for ${invite.name}? This will remove all artifacts (admin, member, temp data) with no remnants.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-invite', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: invite.id,
          memberCode: invite.memberCode,
          phone: invite.phone,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage(
          `Invite for ${invite.name} and all related artifacts deleted`
        );
        setShowSuccessModal(true);
        loadDashboardData(); // Refresh invite history
      } else {
        setErrorMessage(data.error || 'Failed to delete invite');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to delete invite');
      setShowErrorModal(true);
    }
  };

  const handleArchiveEntry = async (entry: any) => {
    // Archive functionality removed - use delete instead
    if (!confirm(`Delete ${entry.name} from Not Found Registry?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-invite', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: entry.id,
          phone: entry.phone,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setSuccessMessage(`${entry.name} removed from Not Found Registry`);
        setShowSuccessModal(true);
        loadDashboardData(); // Refresh not found registry
      } else {
        setErrorMessage(data.error || 'Failed to delete entry');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Failed to delete entry');
      setShowErrorModal(true);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'members':
        return renderMembersContent();
      case 'invite-management':
        return renderInviteManagementContent();
      case 'analytics':
        return renderAnalyticsContent();
      case 'voice-prints':
        return renderVoicePrintsContent();
      case 'security':
        return renderSecurityContent();
      case 'settings':
        return renderSettingsContent();
      case 'logs':
        return renderLogsContent();
      case 'backup':
        return renderBackupContent();
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <>
      {/* Header */}
      <div className='bg-white rounded-lg p-6 mb-6 shadow-sm border border-slate-200'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-slate-800 mb-2'>
              ADMIN DASHBOARD
            </h1>
            <p className='text-slate-600'>AM I HUMAN.net System Management</p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => setShowUploadModal(true)}
              className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
            >
              📁 Upload Content
            </button>
            <button
              onClick={handleClearAll}
              className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
            >
              🗑️ Clear All Members
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center'>
          <div className='text-4xl font-bold text-blue-600 mb-2'>
            {stats.totalMembers}
          </div>
          <div className='text-slate-600 font-medium'>Total Members</div>
        </div>
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center'>
          <div className='text-4xl font-bold text-green-600 mb-2'>
            {stats.newToday}
          </div>
          <div className='text-slate-600 font-medium'>New Today</div>
        </div>
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center'>
          <div className='text-4xl font-bold text-yellow-600 mb-2'>
            {stats.pendingMembers}
          </div>
          <div className='text-slate-600 font-medium'>Pending</div>
        </div>
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center'>
          <div className='text-4xl font-bold text-purple-600 mb-2'>
            {stats.registeredMembers}
          </div>
          <div className='text-slate-600 font-medium'>Registered</div>
        </div>
      </div>
    </>
  );

  const renderMembersContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>
        Member Management
      </h2>
      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search members...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        />
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-slate-200'>
          <thead className='bg-slate-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                Sponsor
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                Member Code
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-slate-200'>
            {filteredMembers.map(member => (
              <tr key={member.memberCode} className='hover:bg-slate-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-slate-900'>
                    {member.name}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-slate-900'>
                    {member.sponsorName || 'N/A'}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-slate-900 font-mono'>
                    {member.memberCode}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (member.status || 'pending') === 'registered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {(member.status || 'pending').toUpperCase()}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  <button
                    onClick={() => {
                      setMemberToDelete(member);
                      setShowDeleteModal(true);
                    }}
                    className='text-red-600 hover:text-red-900'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Not Found Registry Section - Below Member Management */}
      <div className='mt-8'>
        <h3 className='text-xl font-bold text-slate-800 mb-4'>
          Not Found Registry
        </h3>
        <p className='text-sm text-slate-600 mb-4'>
          Phone numbers captured from users who weren&apos;t found in the system
          (4-step flow)
        </p>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Sponsor
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Member Code
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-slate-200'>
              {notFoundRegistry && notFoundRegistry.length > 0 ? (
                notFoundRegistry.map(entry => (
                  <tr key={entry.id} className='hover:bg-slate-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-slate-900'>
                        {entry.name}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-slate-500'>
                        {entry.sponsor || 'no spon'}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-slate-900 font-mono'>
                        {entry.memberCode}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800'>
                        {safeUpperCase(entry.status, 'PENDING')}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <button className='text-blue-600 hover:text-blue-900 mr-3'>
                        View Details
                      </button>
                      <button className='text-green-600 hover:text-green-900 mr-3'>
                        Contact
                      </button>
                      <button
                        onClick={() => handleArchiveEntry(entry)}
                        className='text-orange-600 hover:text-orange-900 font-medium'
                      >
                        ARCH
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-8 text-center text-slate-500'
                  >
                    No phone captures found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>Analytics</h2>
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📊</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          Analytics Dashboard
        </h3>
        <p className='text-slate-500'>
          Advanced analytics and reporting features coming soon.
        </p>
      </div>
    </div>
  );

  const renderVoicePrintsContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>
        Voice Prints Management
      </h2>
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>🎵</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          Voice Prints
        </h3>
        <p className='text-slate-500'>
          Voice print management and verification tools coming soon.
        </p>
      </div>
    </div>
  );

  const renderSecurityContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>
        Security Center
      </h2>
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>🔒</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          Security Dashboard
        </h3>
        <p className='text-slate-500'>
          Security monitoring and threat detection tools coming soon.
        </p>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>
        System Settings
      </h2>
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>⚙️</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          System Configuration
        </h3>
        <p className='text-slate-500'>
          System settings and configuration options coming soon.
        </p>
      </div>
    </div>
  );

  const renderInviteManagementContent = () => (
    <>
      {/* 2-COLUMN LAYOUT FOR INVITE MANAGEMENT */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* LEFT COLUMN - Send New Invitation Form */}
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
          <h2 className='text-2xl font-bold text-slate-800 mb-6'>
            Send New Invitation
          </h2>

          <div className='bg-blue-50 rounded-lg p-6 border border-blue-200'>
            <form onSubmit={handleSendInvitation} className='space-y-4'>
              {/* Single Name Field - Matching Member Dashboard Exactly */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  First, Last Name *
                </label>
                <input
                  type='text'
                  name='name'
                  value={inviteForm.name}
                  onChange={handleInviteFormChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter their full name'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Phone Number *
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={inviteForm.phone}
                  onChange={handleInviteFormChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='(555) 123-4567'
                  maxLength={14}
                  required
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Format: (555) 123-4567
                </p>
              </div>

              {/* Message Preview - Matching Member Dashboard Style */}
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <h4 className='font-semibold text-yellow-800 mb-2'>
                  Message Preview:
                </h4>
                <div className='text-sm text-yellow-700 bg-white p-3 rounded border'>
                  <p>
                    <strong>Hello {inviteForm.name || '[Name]'}!</strong>
                  </p>
                  <p>
                    Am I Human?? Great question huh! Truth: I want to connect to
                    the people I love. That&apos;s you! This is a private space,
                    no ads, no bots, no censorship...just people I love!! Check
                    it out and join me!!
                  </p>
                  <p>
                    Talk soon,
                    <br />
                    <strong>ADMIN</strong>
                  </p>
                </div>
              </div>

              {/* Confirm/Send Button - Matching Member Dashboard */}
              <button
                type='submit'
                disabled={isSendingInvite}
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium'
              >
                {isSendingInvite ? 'â³ Sending...' : '📤 Confirm Invitation'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN - Invitation Preview (Like Member Dashboard) */}
        <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
          <h3 className='text-lg font-semibold text-slate-700 mb-4'>
            Invitation Preview
          </h3>

          <div className='bg-white border border-slate-200 rounded-lg p-4'>
            <h4 className='font-medium text-slate-800 mb-3'>
              Invitation Preview
            </h4>

            {/* Admin Picture */}
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200'>
                <div className='w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                  <span className='text-white font-semibold text-sm'>A</span>
                </div>
              </div>
              <div>
                <p className='font-medium text-slate-800'>ADMIN</p>
                <p className='text-sm text-slate-600'>AM I HUMAN.net Admin</p>
              </div>
            </div>

            {/* Formatted Note */}
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4'>
              <div className='text-sm text-slate-700 leading-relaxed'>
                <p className='mb-2'>
                  <strong>To:</strong> {inviteForm.name || '[Name]'}
                </p>
                <p className='mb-2'>
                  <strong>Phone:</strong> {inviteForm.phone || '[Phone]'}
                </p>
                <div className='border-t border-yellow-300 pt-3 mt-3'>
                  <p className='text-sm text-slate-600 italic'>
                    Hi {inviteForm.name || '[first name]'}, I need you! Will you
                    verify I am human! It&apos;s part of a network I am
                    building. It maybe something you will be interested in. Why?
                    No bots, no scammers, just the people I love... I love you!!
                    Thank you! ADMIN
                  </p>
                </div>
              </div>
            </div>

            {/* Send and Edit Buttons */}
            <div className='flex space-x-3'>
              <button
                onClick={handleSendInvitation}
                disabled={isSendingInvite}
                className='flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {isSendingInvite ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => {
                  setInviteForm({ name: '', phone: '' });
                }}
                className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500'
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW DIV - Invite Status (Below 2-Column Layout) */}
      <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200 mt-6'>
        <h3 className='text-lg font-semibold text-slate-700 mb-4'>
          Sent Invites
        </h3>
        <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
          {inviteHistory.length === 0 ? (
            <div className='text-center py-8'>
              <div className='text-4xl mb-4'>📋</div>
              <p className='text-slate-600'>No invitations sent yet.</p>
              <p className='text-sm text-slate-500 mt-2'>
                Invitation history will appear here.
              </p>
            </div>
          ) : (
            <div className='max-h-96 overflow-y-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-100 sticky top-0'>
                  <tr>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Name
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Phone
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Sponsor
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Sent Date
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Status
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Accept Date
                    </th>
                    <th className='text-left py-2 px-3 font-semibold text-gray-700'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(inviteHistory || []).slice(0, 5).map((invite, index) => {
                    // Parse sent date (createdAt) - handle all Firestore formats
                    let sentDate = 'N/A';
                    try {
                      if (invite.createdAt) {
                        if (invite.createdAt.seconds) {
                          sentDate = new Date(
                            invite.createdAt.seconds * 1000
                          ).toLocaleDateString();
                        } else if (typeof invite.createdAt === 'string') {
                          sentDate = new Date(
                            invite.createdAt
                          ).toLocaleDateString();
                        } else if (invite.createdAt instanceof Date) {
                          sentDate = invite.createdAt.toLocaleDateString();
                        }
                      }
                    } catch (e) {
                      sentDate = 'N/A';
                    }

                    // Parse accept date (matchedAt)
                    let acceptDate = 'Pending';
                    try {
                      if (invite.matchedAt) {
                        if (invite.matchedAt.seconds) {
                          acceptDate = new Date(
                            invite.matchedAt.seconds * 1000
                          ).toLocaleDateString();
                        } else if (typeof invite.matchedAt === 'string') {
                          acceptDate = new Date(
                            invite.matchedAt
                          ).toLocaleDateString();
                        } else if (invite.matchedAt instanceof Date) {
                          acceptDate = invite.matchedAt.toLocaleDateString();
                        }
                      }
                    } catch (e) {
                      acceptDate = 'Pending';
                    }

                    return (
                      <tr
                        key={index}
                        className='border-b border-gray-200 hover:bg-gray-50'
                      >
                        <td className='py-2 px-3 font-medium text-gray-900'>
                          {invite.name}
                        </td>
                        <td className='py-2 px-3 text-gray-600'>
                          {invite.phone}
                        </td>
                        <td className='py-2 px-3 text-gray-600'>
                          {invite.sponsorName}
                        </td>
                        <td className='py-2 px-3 text-gray-600'>{sentDate}</td>
                        <td className='py-2 px-3'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (invite.status || 'pending') === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : (invite.status || 'pending') === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {safeUpperCase(invite.status, 'PENDING')}
                          </span>
                        </td>
                        <td className='py-2 px-3 text-gray-600'>
                          {acceptDate}
                        </td>
                        <td className='py-2 px-3'>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => handleSetActive(invite)}
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                (invite.status || 'pending') === 'active'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-50'
                              }`}
                            >
                              {(invite.status || 'pending') === 'active'
                                ? 'Active'
                                : 'Set Active'}
                            </button>
                            <button
                              onClick={() => handleDeleteInvite(invite)}
                              className='px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {inviteHistory.length > 5 && (
                    <tr>
                      <td
                        colSpan={7}
                        className='py-2 px-3 text-center text-gray-500 text-xs'
                      >
                        ... and {inviteHistory.length - 5} more invites
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderLogsContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>System Logs</h2>

      {/* NF Archive Section */}
      <div className='mb-8'>
        <h3 className='text-xl font-bold text-slate-800 mb-4'>NF Archive</h3>
        <p className='text-sm text-slate-600 mb-4'>
          Archived Not Found entries moved from the registry
        </p>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Phone
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Member Code
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Archived At
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-slate-200'>
              {nfArchive && nfArchive.length > 0 ? (
                nfArchive.map(entry => (
                  <tr key={entry.id} className='hover:bg-slate-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-slate-900'>
                        {entry.name}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-slate-500'>
                        {entry.phone}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-slate-900 font-mono'>
                        {entry.memberCode}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-slate-500'>
                        {(() => {
                          let archivedDate = 'N/A';
                          let archivedTime = '';
                          try {
                            if (entry.archivedAt) {
                              let dateObj;
                              if (entry.archivedAt.seconds) {
                                dateObj = new Date(
                                  entry.archivedAt.seconds * 1000
                                );
                              } else if (typeof entry.archivedAt === 'string') {
                                dateObj = new Date(entry.archivedAt);
                              } else if (entry.archivedAt instanceof Date) {
                                dateObj = entry.archivedAt;
                              }
                              if (dateObj) {
                                archivedDate = dateObj.toLocaleDateString();
                                archivedTime = dateObj.toLocaleTimeString();
                              }
                            }
                          } catch (e) {
                            archivedDate = 'N/A';
                          }
                          return `${archivedDate} ${archivedTime}`;
                        })()}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'>
                        ARCHIVED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className='px-6 py-8 text-center text-slate-500'
                  >
                    No archived entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📋</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          System Logs
        </h3>
        <p className='text-slate-500'>
          Additional system logs and audit trails coming soon.
        </p>
      </div>
    </div>
  );

  const renderBackupContent = () => (
    <div className='bg-white rounded-lg p-6 shadow-sm border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6'>
        Backup & Restore
      </h2>
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>💾</div>
        <h3 className='text-xl font-semibold text-slate-700 mb-2'>
          Backup Management
        </h3>
        <p className='text-slate-500'>
          Data backup and restore functionality coming soon.
        </p>
      </div>
    </div>
  );

  return (
    <div id="admin-shell">
      <aside id="admin-panel">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </aside>
      <main id="admin-main">
        <div className="admin-hero">
          <img src="/amihuman-bkgrnd.png" alt="" />
        </div>
        <div className='max-w-7xl mx-auto'>{renderSectionContent()}</div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Delete Member
            </h3>
            <p className='text-sm text-gray-500 mb-6'>
              Are you sure you want to delete{' '}
              <strong>{memberToDelete?.name}</strong>? This action cannot be
              undone.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMember}
                disabled={isDeleting}
                className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='text-center'>
              <div className='text-green-500 text-4xl mb-4'>✅</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Success
              </h3>
              <p className='text-sm text-gray-500 mb-4'>{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className='px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700'
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='text-center'>
              <div className='text-red-500 text-4xl mb-4'>❌</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Error</h3>
              <p className='text-sm text-gray-500 mb-4'>{errorMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700'
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Clear All Members
            </h3>
            <p className='text-sm text-gray-500 mb-6'>
              Are you sure you want to delete ALL members? This action cannot be
              undone.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowClearAllModal(false)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                disabled={isClearing}
                className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400'
              >
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
