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

    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(memberCode).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      ok: true,
      profile: {
        memberCode,
        name: userData?.name || '',
        fullName: userData?.fullName || userData?.name || '',
        phone: userData?.phone || '',
        email: userData?.email || '',
        voiceUrl: userData?.voiceUrl || '',
        hasVoice: userData?.hasVoice || false,
        profilePicture: userData?.profilePicture || '',
        status: userData?.status || 'pending',
        createdAt: userData?.createdAt || null,
        // Profile completion steps
        profileSteps: {
          primaryVoice: userData?.profileSteps?.primaryVoice || false,
          profileConfirm: userData?.profileSteps?.profileConfirm || false,
          phoneVoice: userData?.profileSteps?.phoneVoice || false
        },
        currentStep: userData?.currentStep || 1
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { memberCode, voiceUrl, hasVoice, fullName, phone, email, profilePicture, profileSteps, currentStep } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing memberCode" },
        { status: 400 }
      );
    }


    // Update user profile in Firestore
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (voiceUrl !== undefined) updateData.voiceUrl = voiceUrl;
    if (hasVoice !== undefined) updateData.hasVoice = hasVoice;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (profileSteps !== undefined) updateData.profileSteps = profileSteps;
    if (currentStep !== undefined) updateData.currentStep = currentStep;

    await db.collection('users').doc(memberCode).update(updateData);


    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      profile: {
        memberCode,
        voiceUrl,
        hasVoice,
        profilePicture
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
