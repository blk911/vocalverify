import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Device fingerprinting service for enhanced security

export async function POST(req: Request) {
  try {
    const { memberCode, fingerprint, userAgent, screenResolution, timezone, language } = await req.json();
    
    if (!memberCode || !fingerprint) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    // For now, just return success without database operations
    // This allows the client-side integration to work
    return NextResponse.json({
      ok: true,
      memberCode,
      fingerprint,
      message: "Device fingerprint received successfully"
    });

  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to process device fingerprint",
      details: error.message
    }, { status: 500 });
  }
}
