import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing memberCode" },
        { status: 400 }
      );
    }

    console.log('Fetching profile for memberCode:', memberCode);

    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(memberCode).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log('Profile data retrieved:', { memberCode, hasVoice: userData?.hasVoice });

    return NextResponse.json({
      ok: true,
      profile: {
        memberCode,
        fullName: userData?.fullName || '',
        phone: userData?.phone || '',
        email: userData?.email || '',
        voiceUrl: userData?.voiceUrl || '',
        hasVoice: userData?.hasVoice || false,
        status: userData?.status || 'pending',
        createdAt: userData?.createdAt || null
      }
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { memberCode, voiceUrl, hasVoice, fullName, phone, email } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing memberCode" },
        { status: 400 }
      );
    }

    console.log('Updating profile for memberCode:', memberCode, { voiceUrl, hasVoice });

    // Update user profile in Firestore
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (voiceUrl !== undefined) updateData.voiceUrl = voiceUrl;
    if (hasVoice !== undefined) updateData.hasVoice = hasVoice;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    await db.collection('users').doc(memberCode).update(updateData);

    console.log('Profile updated successfully:', { memberCode, updateData });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      profile: {
        memberCode,
        voiceUrl,
        hasVoice
      }
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
