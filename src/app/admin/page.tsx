"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all members by checking known member codes
      const memberCodes = ['77777']; // Only show members with data
      const allMembers = [];
      
      for (const memberCode of memberCodes) {
        try {
          const response = await fetch(`/api/user/profile?memberCode=${memberCode}`);
          const data = await response.json();
          
          if (data.ok && data.profile) {
            allMembers.push({
              id: memberCode,
              name: data.profile.fullName || 'Unknown',
              memberCode: memberCode,
              phone: data.profile.phone || '',
              status: 'registered',
              hasVoice: data.profile.hasVoice || false,
              profilePicture: data.profile.profilePicture || '',
              createdAt: data.profile.createdAt || new Date().toISOString()
            });
          }
        } catch (err) {
          }
      }
      
      setMembers(allMembers);
      } catch (err) {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={loadMembers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <h1 className="text-3xl font-bold text-slate-800">ADMIN DASHBOARD</h1>
        <p className="text-slate-600">AM I HUMAN.net System Management</p>
      </div>
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Debug Info */}
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 mb-4 rounded-lg">
            <strong>DEBUG:</strong> Admin Dashboard - Members: {members.length} | First: {members[0]?.name || 'None'} | Voice: {members[0]?.hasVoice ? 'Yes' : 'No'} | Picture: {members[0]?.profilePicture ? 'Yes' : 'No'}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {members.length}
              </div>
              <div className="text-slate-600 font-medium">
                Total Members
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {members.filter(m => m.hasVoice).length}
              </div>
              <div className="text-slate-600 font-medium">
                With Voice
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {members.filter(m => m.profilePicture).length}
              </div>
              <div className="text-slate-600 font-medium">
                With Picture
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {members.filter(m => m.hasVoice && m.profilePicture).length}
              </div>
              <div className="text-slate-600 font-medium">
                Complete
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Member Management
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Member Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Voice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Picture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {member.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-mono">
                          {member.memberCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {member.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${member.hasVoice ? 'text-green-600' : 'text-red-600'}`}>
                            {member.hasVoice ? '✓' : '✗'}
                          </span>
                          <span className="ml-2 text-sm text-slate-600">
                            {member.hasVoice ? 'Recorded' : 'Not recorded'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${member.profilePicture ? 'text-green-600' : 'text-red-600'}`}>
                            {member.profilePicture ? '✓' : '✗'}
                          </span>
                          <span className="ml-2 text-sm text-slate-600">
                            {member.profilePicture ? 'Uploaded' : 'Not uploaded'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {member.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {members.length === 0 && (
              <div className="text-center py-8">
                <div className="text-slate-500 text-lg">No members found</div>
                <div className="text-slate-400 text-sm mt-1">
                  No members have been registered yet
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
