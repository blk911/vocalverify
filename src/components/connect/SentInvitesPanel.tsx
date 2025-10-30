'use client';

import { useEffect, useState } from 'react';

type Invite = { id: string; to?: { phone?: string; email?: string }; status?: string; createdAt?: string };

export default function SentInvitesPanel() {
  const [items, setItems] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invites/pending?type=outgoing', { cache: 'no-store' });
      const j = await res.json();
      setItems(j.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Sent Invites</h2>
        <button onClick={refresh} className="text-xs px-2 py-1 rounded border">Refresh</button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-500">No sent invites.</p>}

      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="rounded-xl border px-3 py-2">
            <div className="text-sm">
              <div className="font-medium">{x.to?.email || x.to?.phone || 'Recipient'}</div>
              <div className="text-gray-500 text-xs">Status: {x.status ?? 'pending'} · {x.createdAt ?? ''}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
