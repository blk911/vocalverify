import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "service_unavailable", detail: "Chat send not configured" },
    { status: 503, headers: { "x-policy": "no-mocks" } }
  );
}
