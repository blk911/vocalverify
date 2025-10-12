import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode, audioData, voiceType } = await req.json();
    
    if (!memberCode || !audioData) {
      return NextResponse.json(
        { ok: false, error: "Member code and audio data are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get user document
    const userRef = db.collection('users').doc(memberCode);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update user with voice data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (voiceType === 'profile') {
      updateData.voiceUrl = audioData;
      updateData.hasVoice = true;
    } else if (voiceType === 'phone') {
      updateData.phoneVoiceUrl = audioData;
      updateData.hasPhoneVoice = true;
    }

    await userRef.update(updateData);

    return NextResponse.json({
      ok: true,
      message: "Voice print uploaded successfully",
      voiceType: voiceType,
      hasVoice: true
    });

  } catch (error: any) {
    console.error('Error uploading voice print:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to upload voice print" },
      { status: 500 }
    );
  }
}


