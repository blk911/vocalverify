import { NextResponse } from "next/server";
import { awsTranscribeVoiceAuth } from "@/lib/awsTranscribe";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { memberCode, audioBuffer, phoneDigits } = await req.json();
    
    if (!memberCode || !audioBuffer) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const expectedPhone = userData?.phone || phoneDigits;

    // Convert base64 audio buffer to Buffer
    const audioBufferData = Buffer.from(audioBuffer, 'base64');

    // Verify voice using AWS Transcribe
    const fileName = `voice-${memberCode}-${Date.now()}.webm`;
    const verificationResult = await awsTranscribeVoiceAuth.verifyVoice(
      audioBufferData,
      fileName,
      expectedPhone
    );

    // Log verification attempt
    await db.collection('verification_logs').add({
      memberCode,
      timestamp: new Date().toISOString(),
      verificationResult,
      expectedPhone,
      providedPhone: phoneDigits,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
    });

    // Update user's verification status
    if (verificationResult.isVerified) {
      await db.collection('users').doc(memberCode).update({
        lastVerified: new Date().toISOString(),
        verificationCount: (userData?.verificationCount || 0) + 1,
        securityLevel: verificationResult.securityLevel,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      memberCode,
      verificationResult,
      message: verificationResult.isVerified 
        ? "Voice verification successful" 
        : "Voice verification failed"
    });

  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to verify voice",
      details: error.message
    }, { status: 500 });
  }
}
