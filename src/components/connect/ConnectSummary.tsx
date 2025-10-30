'use client';

import { useEffect, useState } from 'react';

export default function ConnectSummary({ memberCode }: { memberCode?: string }) {
  const [stats, setStats] = useState<{pending:number; outgoing:number; recent:number} | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const [incoming, outgoing, recent] = await Promise.all([
          fetch('/api/invites/pending?type=incoming', { cache: 'no-store' }),
          fetch('/api/invites/pending?type=outgoing', { cache: 'no-store' }),
          fetch('/api/invites/pending?type=recent', { cache: 'no-store' }),
        ]);
        const [i, o, r] = await Promise.all([incoming.json(), outgoing.json(), recent.json()]);
        if (!abort) setStats({ pending: i.items?.length||0, outgoing: o.items?.length||0, recent: r.items?.length||0 });
      } catch (error) {
        console.warn('ConnectSummary API calls failed, using fallback:', error);
        if (!abort) setStats({ pending: 0, outgoing: 0, recent: 0 });
      }
    })();
    return () => { abort = true; };
  }, []);

  return (
    <div className="rounded-xl border bg-white px-4 py-3 text-sm flex items-center gap-4">
      <div><span className="font-semibold">{stats?.pending ?? '—'}</span> pending</div>
      <div><span className="font-semibold">{stats?.outgoing ?? '—'}</span> sent</div>
      <div><span className="font-semibold">{stats?.recent ?? '—'}</span> recent</div>
      {memberCode && <div className="ml-2 text-gray-400">|</div>}
      {memberCode && <div className="text-gray-500">Member: {memberCode}</div>}
    </div>
  );
}
