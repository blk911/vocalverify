'use client';

import { useEffect, useState } from 'react';

type Bond = { id: string; memberName?: string; memberCode?: string; connectedAt?: string };

export default function RecentConnections() {
  const [items, setItems] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/invites/pending?type=recent', { cache: 'no-store' });
        const j = await res.json();
        if (!abort) setItems((j.items || []).slice(0, 5));
      } catch {
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (items.length === 0) return <p className="text-sm text-gray-500">No recent connections.</p>;

  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.id} className="rounded-xl border px-3 py-2 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{b.memberName ?? 'Member'}</div>
            <div className="text-gray-500 text-xs">Member {b.memberCode ?? '—'} · {b.connectedAt ?? ''}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Connected</span>
        </li>
      ))}
    </ul>
  );
}
