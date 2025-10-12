import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get user's voice prints
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    const voicePrints = {
      profileVoice: {
        audioUrl: userData.voiceUrl || null,
        hasVoice: userData.hasVoice || false
      },
      phoneVoice: {
        audioUrl: userData.phoneVoiceUrl || null,
        hasVoice: userData.hasPhoneVoice || false
      }
    };

    return NextResponse.json({
      ok: true,
      memberCode: memberCode,
      voicePrints: voicePrints
    });

  } catch (error: any) {
    console.error('Error fetching voice prints:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch voice prints" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { memberCode, voiceUrl, hasVoice } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Update user with voice data
    await db.collection('users').doc(memberCode).update({
      voiceUrl: voiceUrl || null,
      hasVoice: hasVoice || false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      ok: true,
      message: "Voice print saved successfully"
    });

  } catch (error: any) {
    console.error('Error saving voice print:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to save voice print" },
      { status: 500 }
    );
  }
}


