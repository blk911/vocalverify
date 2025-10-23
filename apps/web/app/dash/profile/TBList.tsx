'use client';
import { useState } from "react";
export default function TBList() {
  const [active, setActive] = useState<string| null>("TB_spencer_ash");
  const tbs = [{id:"TB_spencer_ash", label:"Spencer ↔ Ash", entropy:38}];
  return (
    <div className="space-y-2">
      {tbs.map(tb=>(
        <label key={tb.id} className="flex items-center gap-2">
          <input
            type="radio"
            name="tb"
            checked={active===tb.id}
            onChange={()=>setActive(tb.id)}
          />
          <span>{tb.label}</span>
          <span className="text-xs text-gray-500">entropy {tb.entropy}</span>
        </label>
      ))}
      <p className="text-xs text-gray-500">Selected TB is used for auth-usable artifacts.</p>
    </div>
  );
}
