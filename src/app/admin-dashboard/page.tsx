'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: number, name: string} | null>(null);
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Repair Test User",
      memberCode: "77777",
      phone: "555-7777",
      hasVoice: true,
      hasPicture: true,
      status: "PENDING"
    },
    {
      id: 2,
      name: "Test User",
      memberCode: "9999",
      phone: "555-123-4567",
      hasVoice: false,
      hasPicture: false,
      status: "PENDING"
    }
  ]);

  const handleDeleteClick = (memberId: number, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: memberToDelete.id })
      });

      if (response.ok) {
        setMembers(members.filter(member => member.id !== memberToDelete.id));
        setShowDeleteModal(false);
        setMemberToDelete(null);
      } else {
        console.error('Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMemberToDelete(null);
  };

  const handleView = (memberId: number, memberName: string) => {
    console.log(`Viewing details for ${memberName} (ID: ${memberId})`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            <a href="/admin-dashboard" className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
              <span className="mr-3">📊</span>
              Dashboard
            </a>
            <a href="/admin-dashboard/members" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">👥</span>
              Members
            </a>
            <a href="/admin-dashboard/voice-prints" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">🎤</span>
              Voice Prints
            </a>
            <a href="/admin-dashboard/analytics" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">📈</span>
              Analytics
            </a>
            <a href="/admin-dashboard/settings" className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">⚙️</span>
              Settings
            </a>
            <a href="/" className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
              <span className="mr-3">🚪</span>
              Logout
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">ADMIN DASHBOARD</h1>
          <p className="text-gray-600">AM I HUMAN.net System Management</p>
        </div>
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{members.length}</div>
                <div className="text-gray-600 font-medium">Total Members</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{members.filter(m => m.hasVoice).length}</div>
                <div className="text-gray-600 font-medium">With Voice</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{members.filter(m => m.hasPicture).length}</div>
                <div className="text-gray-600 font-medium">With Picture</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">{members.filter(m => m.hasVoice && m.hasPicture).length}</div>
                <div className="text-gray-600 font-medium">Complete</div>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Member Management</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Picture</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{member.memberCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-lg font-bold ${member.hasVoice ? 'text-green-600' : 'text-red-600'}`}>
                              {member.hasVoice ? '✓' : '✗'}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              {member.hasVoice ? 'Recorded' : 'Not recorded'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-lg font-bold ${member.hasPicture ? 'text-green-600' : 'text-red-600'}`}>
                              {member.hasPicture ? '✓' : '✗'}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              {member.hasPicture ? 'Uploaded' : 'Not uploaded'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleView(member.id, member.name)}
                              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(member.id, member.name)}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{memberToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}