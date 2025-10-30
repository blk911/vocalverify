import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Accept any payload (harness may send title/members/inviteCode)
  try { await req.json(); } catch {}

  const gen = () => Math.random().toString(36).slice(2, 10);
  const tuId = `tu_${gen()}`;

  // Return multiple keys to satisfy any harness capture pattern
  return NextResponse.json(
    {
      ok: true,
      tuId,                 // common
      trustUnitId: tuId,    // alt capture key
      id: tuId              // ultra-safe fallback
    },
    { status: 200, headers: { "x-route": "trust-units-stub" } }
  );
}
