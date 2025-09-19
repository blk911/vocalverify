import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone, name, voiceBlob, picture } = await req.json();
    
    console.log("User create received:", { phone, name, voiceBlob, picture });
    
    // Extract digits and validate - phone IS the member code (10 digits)
    const memberCode = phone.replace(/\D/g, "");
    if (!phone || memberCode.length !== 10) {
      console.log("Invalid member code format:", phone, "digits:", memberCode);
      return NextResponse.json(
        { ok: false, error: "Invalid member code", code: "INVALID_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    console.log("Member code:", memberCode);

    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid name", code: "INVALID_NAME" },
        { status: 400 }
      );
    }

    // Create or update user record
    const userData = {
      phone: memberCode,
      fullName: name,
      status: "registered", // Set as registered after completing the flow
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hasVoice: !!voiceBlob,
      hasPicture: !!picture,
      // Store file URLs if provided
      pictureUrl: picture || null,
      voiceUrl: voiceBlob || null
    };

    await db.collection("users").doc(memberCode).set(userData, { merge: true });

    return NextResponse.json({
      ok: true,
      userId: memberCode,
      status: "registered",
      message: "User created successfully"
    });

  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}





