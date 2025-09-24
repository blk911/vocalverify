import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('User create API called');
    
    const { name, memberCode, phone } = await req.json();
    
    console.log('Creating user:', { name, memberCode, phone });
    
    // Validate required fields
    if (!name || !memberCode || !phone) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }
    
    // Validate member code format (should be numeric)
    if (!/^\d+$/.test(memberCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid member code", code: "INVALID_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const userRef = db.collection('users').doc(memberCode);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User already exists", code: "USER_EXISTS" },
        { status: 409 }
      );
    }
    
    // Create new user
    const userData = {
      name: name.trim(),
      memberCode: memberCode,
      phone: phone.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      hasVoice: false,
      voiceUrl: null
    };
    
    await userRef.set(userData);
    
    console.log('User created successfully:', { memberCode, name });
    
    return NextResponse.json({
      ok: true,
      message: "User created successfully",
      user: {
        memberCode,
        name,
        status: 'pending'
      }
    });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to create user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
