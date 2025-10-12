"use client";
import { useState, useEffect } from 'react';

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

export default function TrustNetworkManager({ memberCode }: TrustNetworkManagerProps) {
  const [trustStatus, setTrustStatus] = useState<any>(null);
  const [trustMembers, setTrustMembers] = useState<TrustUnitMember[]>([]);
  const [pendingBonds, setPendingBonds] = useState<TrustBond[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBond, setShowCreateBond] = useState(false);
  const [targetMemberCode, setTargetMemberCode] = useState('');
  const [bondMessage, setBondMessage] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (memberCode) {
      loadTrustData();
    }
  }, [memberCode]);

  const loadTrustData = async () => {
    setLoading(true);
    try {
      // Load trust unit status
      const statusResponse = await fetch(`/api/trust/units/status?memberCode=${memberCode}`);
      const statusData = await statusResponse.json();
      if (statusData.ok) {
        setTrustStatus(statusData);
      }

      // Load trust unit members
      const membersResponse = await fetch(`/api/trust/units/members?memberCode=${memberCode}`);
      const membersData = await membersResponse.json();
      if (membersData.ok) {
        setTrustMembers(membersData.members || []);
      }

      // Load pending bonds (you'll need to create this endpoint or query Firestore)
      // For now, we'll skip this
      
    } catch (error) {
      console.error('Error loading trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBond = async () => {
    if (!targetMemberCode.trim()) {
      alert('Please enter a member code');
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
          message: bondMessage || 'Let\'s connect on AM I HUMAN!'
        })
      });

      const data = await response.json();
      if (data.ok) {
        alert('Trust bond request sent successfully!');
        setTargetMemberCode('');
        setBondMessage('');
        setShowCreateBond(false);
        loadTrustData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating bond:', error);
      alert('Failed to create trust bond');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Trust Network Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🤝 Your Trust Network</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {trustStatus?.trustUnit?.size || 0}
            </div>
            <div className="text-sm text-gray-600">Trust Unit Size</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {trustStatus?.connections || 0}
            </div>
            <div className="text-sm text-gray-600">Direct Connections</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {trustStatus?.pendingBonds?.total || 0}
            </div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateBond(!showCreateBond)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {showCreateBond ? '❌ Cancel' : '➕ Create Trust Bond'}
        </button>

        {showCreateBond && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Send Trust Bond Request</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Code
                </label>
                <input
                  type="text"
                  value={targetMemberCode}
                  onChange={(e) => setTargetMemberCode(e.target.value)}
                  placeholder="Enter member code (e.g., 1234567890)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={bondMessage}
                  onChange={(e) => setBondMessage(e.target.value)}
                  placeholder="Let's connect on AM I HUMAN!"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleCreateBond}
                disabled={creating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  creating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {creating ? 'Sending...' : '📤 Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trust Unit Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Trust Unit Members ({trustMembers.length})
        </h2>

        {trustMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>You're not part of a trust unit yet.</p>
            <p className="text-sm mt-2">Create a trust bond to start building your network!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustMembers.map((member) => (
              <div
                key={member.memberCode}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-3">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{member.name}</h3>
                    <p className="text-xs text-gray-500">{member.memberCode}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.connectionStatus === 'self'
                      ? 'bg-purple-100 text-purple-800'
                      : member.connectionStatus === 'direct'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {member.connectionStatus === 'self' ? '👤 You' : 
                     member.connectionStatus === 'direct' ? '🔗 Direct' : 
                     '🌐 Indirect'}
                  </span>

                  {member.hasVoice && (
                    <span className="text-green-600 text-xs">🎤 Verified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}









