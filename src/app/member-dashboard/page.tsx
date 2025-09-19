"use client";
import { useSearchParams } from 'next/navigation';

export default function MemberDashboard() {
  const searchParams = useSearchParams();
  const memberName = searchParams.get('name') || 'Member';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          WELCOME {memberName.toUpperCase()}
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          marginBottom: '30px'
        }}>
          You are now a registered member!
        </p>
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            View Profile
          </button>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#f3f4f6',
            color: '#000',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
