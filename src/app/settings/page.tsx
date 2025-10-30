'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from "next/dynamic";
import Topbar from '@/components/mem/Topbar';
import Sidebar from '@/components/mem/Sidebar';

const SystemFlowMap = dynamic(() => import("@/components/SystemFlowMap"), { ssr: false });

export default function SettingsPage() {
  const [memberCode, setMemberCode] = useState<string>('');
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('memberCode');
    if (code) {
      setMemberCode(code);
      loadMemberData(code);
    } else {
      setError('No member code provided');
      setLoading(false);
    }
  }, [searchParams]);

  const loadMemberData = async (code: string) => {
    try {
      setLoading(true);
      
      // Handle demo mode
      if (code === 'demo') {
        setMemberData({
          name: 'Demo User',
          fullName: 'Demo User',
          phone: '555-0123',
          memberCode: 'demo',
          profilePicture: '',
          hasVoice: false,
          status: 'demo',
        });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/user/profile?memberCode=${code}`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setMemberData(data.profile);
        } else {
          setError(data.error || 'Failed to load member data');
        }
      } else {
        setError('Failed to load member data');
      }
    } catch (err) {
      setError('Network error loading member data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-pulse rounded-full h-12 w-12 bg-blue-100 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-slate-800 mb-2'>
            Loading Settings...
          </h2>
          <p className='text-slate-600'>
            Preparing your settings view
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h2 className='text-xl font-bold text-gray-800 mb-2'>Error</h2>
          <p className='text-gray-600'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <Topbar
        memberData={memberData}
        micAvailable={false}
        cameraAvailable={false}
      />

      <div className='flex'>
        <Sidebar 
          activeSection='settings' 
          onSectionChange={() => {}}
        />

        <main className='flex-1'>
          {/* HERO SECTION - TOP NAV INV CONN NETW */}
          <div className='bg-white border-b border-slate-200 px-6 py-3'>
            <div className='flex items-center space-x-6'>
              <button
                onClick={() => window.location.href = `/member-dashboard?memberCode=${memberCode}`}
                className='px-4 py-2 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100'
              >
                INVITE
              </button>
              <button
                onClick={() => window.location.href = `/member-dashboard?memberCode=${memberCode}`}
                className='px-4 py-2 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100'
              >
                CONNECT
              </button>
              <button
                onClick={() => window.location.href = `/network?memberCode=${memberCode}`}
                className='px-4 py-2 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100'
              >
                NETWORK
              </button>
            </div>
          </div>

          {/* MAIN CONTENT WITH PADDING */}
          <div className='p-6 space-y-6'>
            <div className='bg-white rounded-xl border border-slate-200 p-6'>
              <h1 className='text-2xl font-semibold text-slate-800 mb-6'>System Flows</h1>
              <SystemFlowMap />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}