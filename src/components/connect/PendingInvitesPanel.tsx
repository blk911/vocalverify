'use client';

import { useEffect, useState } from 'react';

type Invite = {
  id: string;
  from?: { name?: string; memberCode?: string };
  createdAt?: string;
};

export default function PendingInvitesPanel() {
  const [items, setItems] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invites/pending?type=incoming', { cache: 'no-store' });
      const j = await res.json();
      setItems(j.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    const res = await fetch('/api/invites/respond', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ inviteId: id, action }),
    });
    if (res.ok) refresh();
  };

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Pending Invites</h2>
        <button onClick={refresh} className="text-xs px-2 py-1 rounded border">Refresh</button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-500">No pending invites.</p>}

      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="rounded-xl border px-3 py-2 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{x.from?.name ?? 'Unknown'}</div>
              <div className="text-gray-500 text-xs">Member {x.from?.memberCode ?? '—'} · {x.createdAt ?? ''}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => respond(x.id, 'accept')} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Accept</button>
              <button onClick={() => respond(x.id, 'decline')} className="text-xs px-2 py-1 rounded bg-gray-200">Decline</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
