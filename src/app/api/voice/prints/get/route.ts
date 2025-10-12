import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    const personNumber = searchParams.get('personNumber');
    
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
    
    // Get voice print data based on personNumber
    let voiceData = null;
    if (personNumber === 'profile') {
      voiceData = {
        audioUrl: userData.voiceUrl || null,
        hasVoice: userData.hasVoice || false,
        voiceType: 'profile'
      };
    } else if (personNumber === 'phone') {
      voiceData = {
        audioUrl: userData.phoneVoiceUrl || null,
        hasVoice: userData.hasPhoneVoice || false,
        voiceType: 'phone'
      };
    } else {
      voiceData = {
        profileVoice: {
          audioUrl: userData.voiceUrl || null,
          hasVoice: userData.hasVoice || false
        },
        phoneVoice: {
          audioUrl: userData.phoneVoiceUrl || null,
          hasVoice: userData.hasPhoneVoice || false
        }
      };
    }

    return NextResponse.json({
      ok: true,
      memberCode: memberCode,
      voiceData: voiceData
    });

  } catch (error: any) {
    console.error('Error fetching voice prints:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch voice prints" },
      { status: 500 }
    );
  }
}


