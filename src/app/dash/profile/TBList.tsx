'use client';
import { useState, useEffect } from 'react';

interface TrustBond {
  id: string;
  fromMemberCode: string;
  toMemberCode: string;
  fromMemberName: string;
  toMemberName: string;
  status: string;
  message?: string;
  createdAt: any;
  direction?: 'sent' | 'received';
}

interface TBListProps {
  memberCode?: string;
  trustBonds?: TrustBond[];
}

export default function TBList({ memberCode, trustBonds = [] }: TBListProps) {
  const [active, setActive] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load trust bonds if not provided
  useEffect(() => {
    if (!memberCode || trustBonds.length > 0) return;
    
    const loadTrustBonds = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/trust-bonds/list?memberCode=${memberCode}`);
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.trustBonds.length > 0) {
            setActive(data.trustBonds[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading trust bonds:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrustBonds();
  }, [memberCode, trustBonds.length]);

  // Use provided trust bonds or empty array
  const bonds = trustBonds.length > 0 ? trustBonds : [];

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (bonds.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">No trust bonds available</p>
        <p className="text-xs text-gray-400">
          Create trust bonds to use for auth-usable artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bonds.map(bond => {
        const partnerName = bond.direction === 'sent' 
          ? bond.toMemberName 
          : bond.fromMemberName;
        const label = `${bond.fromMemberName} ↔ ${bond.toMemberName}`;
        const entropy = Math.floor(Math.random() * 50) + 20; // Random entropy for now
        
        return (
          <label key={bond.id} className="flex items-center gap-2">
            <input
              type="radio"
              name="tb"
              checked={active === bond.id}
              onChange={() => setActive(bond.id)}
            />
            <span className="text-sm">{label}</span>
            <span className="text-xs text-gray-500">entropy {entropy}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              bond.status === 'accepted' ? 'bg-green-100 text-green-800' :
              bond.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {bond.status}
            </span>
          </label>
        );
      })}
      <p className="text-xs text-gray-500">
        Selected TB is used for auth-usable artifacts.
      </p>
    </div>
  );
}