import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ uploadId: randomUUID() });
}
