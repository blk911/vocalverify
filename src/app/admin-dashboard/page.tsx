"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/mem/Sidebar";
import Topbar from "@/components/mem/Topbar";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    newToday: 0,
    pendingMembers: 0,
    registeredMembers: 0
  });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load system stats
      const statsResponse = await fetch('/api/admin/stats');
      const statsData = await statsResponse.json();
      if (statsData.ok) {
        setStats(statsData.stats);
      }

      // Load members list
      const membersResponse = await fetch('/api/admin/members');
      const membersData = await membersResponse.json();
      if (membersData.ok) {
        setMembers(membersData.members);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-50 p-6">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                ADMIN DASHBOARD
              </h1>
              <p className="text-slate-600">
                AM I HUMAN.net System Management
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              📤 Upload Content
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {stats.totalMembers}
            </div>
            <div className="text-slate-600 font-medium">
              Total Members
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {stats.newToday}
            </div>
            <div className="text-slate-600 font-medium">
              New Today
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {stats.pendingMembers}
            </div>
            <div className="text-slate-600 font-medium">
              Pending Approval
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {stats.registeredMembers}
            </div>
            <div className="text-slate-600 font-medium">
              Registered
            </div>
          </div>
        </div>

        {/* Member Management */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Member Management
          </h2>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search members by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Members Table */}
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Name</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Member Code</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Status</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Voice</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Picture</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={index} style={{
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <td style={{
                      padding: '12px',
                      color: '#374151'
                    }}>
                      {member.name || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      color: '#374151',
                      fontFamily: 'monospace'
                    }}>
                      {member.phone || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: member.status === 'registered' ? '#dcfce7' : 
                                        member.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: member.status === 'registered' ? '#166534' : 
                               member.status === 'pending' ? '#92400e' : '#991b1b'
                      }}>
                        {member.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px',
                      color: member.voiceRecorded ? '#10b981' : '#ef4444'
                    }}>
                      {member.voiceRecorded ? '✓' : '✗'}
                    </td>
                    <td style={{
                      padding: '12px',
                      color: member.picture ? '#10b981' : '#ef4444'
                    }}>
                      {member.picture ? '✓' : '✗'}
                    </td>
                    <td style={{
                      padding: '12px'
                    }}>
                      <button
                        onClick={() => setSelectedMember(member)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 20px 0'
              }}>
                Member Details
              </h3>
              
              <div style={{
                marginBottom: '15px'
              }}>
                <strong>Name:</strong> {selectedMember.name || 'N/A'}
              </div>
              
              <div style={{
                marginBottom: '15px'
              }}>
                <strong>Member Code:</strong> {selectedMember.phone || 'N/A'}
              </div>
              
              <div style={{
                marginBottom: '15px'
              }}>
                <strong>Status:</strong> {selectedMember.status?.toUpperCase() || 'UNKNOWN'}
              </div>
              
              <div style={{
                marginBottom: '15px'
              }}>
                <strong>Voice Recording:</strong> {selectedMember.voiceRecorded ? '✓ Recorded' : '✗ Not recorded'}
              </div>
              
              <div style={{
                marginBottom: '15px'
              }}>
                <strong>Picture:</strong> {selectedMember.picture ? '✓ Uploaded' : '✗ Not uploaded'}
              </div>
              
              <div style={{
                marginBottom: '20px'
              }}>
                <strong>Created:</strong> {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleString() : 'N/A'}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={() => setSelectedMember(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                
                {selectedMember.status === 'pending' && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/approve-member', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ memberCode: selectedMember.phone })
                        });
                        
                        if (response.ok) {
                          alert('Member approved successfully!');
                          setSelectedMember(null);
                          loadDashboardData();
                        } else {
                          alert('Error approving member');
                        }
                      } catch (error) {
                        console.error('Error approving member:', error);
                        alert('Error approving member');
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Member
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Content Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Upload Content</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Upload your logo files to update the system branding
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    📱 Logo Thumbnail (50x50px)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Small logo for sidebar and topbar - will be resized to 50x50px
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('logo', file);
                        formData.append('type', 'thumb');
                        
                        try {
                          const response = await fetch('/api/upload/logo', {
                            method: 'POST',
                            body: formData
                          });
                          const result = await response.json();
                          if (result.ok) {
                            alert('✅ Thumbnail logo uploaded successfully!');
                          } else {
                            alert('❌ Upload failed: ' + result.error);
                          }
                        } catch (error) {
                          alert('❌ Upload error: ' + error);
                        }
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    🖼️ Logo Insert (Full Size)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Full-size logo for main branding areas - recommended 200x200px or larger
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('logo', file);
                        formData.append('type', 'insert');
                        
                        try {
                          const response = await fetch('/api/upload/logo', {
                            method: 'POST',
                            body: formData
                          });
                          const result = await response.json();
                          if (result.ok) {
                            alert('✅ Insert logo uploaded successfully!');
                          } else {
                            alert('❌ Upload failed: ' + result.error);
                          }
                        } catch (error) {
                          alert('❌ Upload error: ' + error);
                        }
                      }
                    }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 text-center pt-2 border-t">
                  💡 Tip: Upload your GIF logo for animated branding
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}





