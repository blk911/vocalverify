import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    { ok: true, name: "amihuman", time: new Date().toISOString() },
    { status: 200 }
  );
}
