'use client';
import { useState } from 'react';

type TB = { id: string; label: string; entropy: number };

const DEFAULT_TBS: TB[] = [
  { id: 'TB_spencer_ash', label: 'Spencer ↔ Ash', entropy: 38 },
];

export default function TBList() {
  const [active, setActive] = useState<string>(DEFAULT_TBS[0]?.id ?? '');

  return (
    <div className="space-y-2">
      {DEFAULT_TBS.map(tb => (
        <label key={tb.id} className="flex items-center gap-2">
          <input
            type="radio"
            name="tb"
            checked={active === tb.id}
            onChange={() => setActive(tb.id)}
          />
          <span>{tb.label}</span>
          <span className="text-xs text-gray-500">entropy {tb.entropy}</span>
        </label>
      ))}
      <p className="text-xs text-gray-500">
        Selected TB is used for auth-usable artifacts.
      </p>
    </div>
  );
}