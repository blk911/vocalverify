'use client';

import { useEffect, useState } from 'react';
import ConnectSummary from '@/components/connect/ConnectSummary';
import PendingInvitesPanel from '@/components/connect/PendingInvitesPanel';
import SentInvitesPanel from '@/components/connect/SentInvitesPanel';
import RecentConnections from '@/components/connect/RecentConnections';

export default function ConnectPage() {
  const [memberCode, setMemberCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mc = localStorage.getItem('memberCode');
      if (mc) setMemberCode(mc);
    } catch {}
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Connect</h1>
          <p className="text-sm text-gray-500">
            Manage your sponsor, invitations, and one-to-one connections.
          </p>
        </div>
        <ConnectSummary memberCode={memberCode ?? undefined} />
      </header>

      {/* Sponsor card (read-only, quick sanity) */}
      <section className="rounded-2xl border p-4 bg-white">
        <h2 className="text-lg font-medium mb-3">Sponsor</h2>
        <SponsorMini memberCode={memberCode ?? undefined} />
      </section>

      {/* Invitations */}
      <section className="grid md:grid-cols-2 gap-6">
        <PendingInvitesPanel />
        <SentInvitesPanel />
      </section>

      {/* Recently accepted (last few 1:1 bonds) */}
      <section className="rounded-2xl border p-4 bg-white">
        <h2 className="text-lg font-medium mb-3">Recent Connections</h2>
        <RecentConnections />
      </section>
    </main>
  );
}

/** Tiny sponsor display that reads current sponsor from your user profile API */
function SponsorMini({ memberCode }: { memberCode?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        // Try to get memberCode from localStorage first
        const memberCode = localStorage.getItem('memberCode') || 'demo';
        const res = await fetch(`/api/user/profile?memberCode=${memberCode}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('profile fetch failed');
        const j = await res.json();
        if (!abort) setData(j);
      } catch (e) {
        console.warn('Profile fetch failed, using fallback data:', e);
        if (!abort) setData({ sponsor: null });
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading sponsor…</p>;
  const sponsor = data?.sponsor ?? null;

  return (
    <div className="rounded-xl border p-4 bg-gradient-to-br from-indigo-50 to-white">
      {sponsor ? (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">{sponsor.name ?? 'Your Sponsor'}</div>
            <div className="text-xs text-gray-500">Member Code: {sponsor.memberCode ?? '—'}</div>
            <div className="text-xs text-gray-500">Status: {sponsor.status ?? 'Active'}</div>
          </div>
          <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            👑 Sponsor
          </span>
        </div>
      ) : (
        <div className="text-sm text-gray-600">No sponsor on file.</div>
      )}
    </div>
  );
}