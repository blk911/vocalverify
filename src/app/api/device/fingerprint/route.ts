import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { memberCode, fingerprint, userAgent, screenResolution, timezone, language } = await req.json();
    
    if (!memberCode || !fingerprint) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    console.log('Device fingerprint API called for memberCode:', memberCode);

    const deviceProfile = {
      memberCode,
      fingerprint,
      userAgent: userAgent || '',
      screenResolution: screenResolution || '',
      timezone: timezone || '',
      language: language || '',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      trustScore: 0.8, // Initial trust score
      verified: true
    };

    // Store device fingerprint in database
    await db.collection("device_fingerprints").doc(`${memberCode}_${fingerprint}`).set(deviceProfile, { merge: true });

    // Update user's device list
    await db.collection('users').doc(memberCode).update({
      devices: db.FieldValue.arrayUnion(fingerprint),
      lastDeviceFingerprint: fingerprint,
      updatedAt: new Date().toISOString()
    });

    console.log('Device fingerprint stored successfully:', memberCode);

    return NextResponse.json({
      ok: true,
      memberCode,
      fingerprint,
      message: "Device fingerprint stored successfully"
    });

  } catch (error: any) {
    console.error('Device fingerprint error:', error);
    return NextResponse.json({
      error: "Failed to store device fingerprint",
      details: error.message
    }, { status: 500 });
  }
}
