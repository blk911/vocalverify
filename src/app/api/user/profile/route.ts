import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing member code" },
        { status: 400 }
      );
    }

    // Validate member code format
    const digits = memberCode.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Invalid member code" },
        { status: 400 }
      );
    }

    // Get user profile from Firestore
    const userDoc = await db.collection("users").doc(memberCode).get();
    
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
        memberCode: memberCode,
        fullName: userData?.fullName,
        status: userData?.status,
        hasVoice: userData?.hasVoice || false,
        hasPicture: userData?.hasPicture || false,
        pictureUrl: userData?.pictureUrl || null,
        voiceUrl: userData?.voiceUrl || null,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt
      }
    });

  } catch (error) {
    console.error("Profile retrieval error:", error);
    return NextResponse.json(
      { ok: false, error: "Profile retrieval failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { memberCode, updates } = await req.json();

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing member code" },
        { status: 400 }
      );
    }

    // Validate member code format
    const digits = memberCode.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Invalid member code" },
        { status: 400 }
      );
    }

    // Update user profile
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };

    await db.collection("users").doc(memberCode).update(updateData);

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully"
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { ok: false, error: "Profile update failed" },
      { status: 500 }
    );
  }
}


