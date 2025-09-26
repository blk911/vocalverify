import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('User check API called');
    
    const { memberCode } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code required", code: "MISSING_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    const userRef = db.collection('users').doc(memberCode);
    const userDoc = await userRef.get();
    
    return NextResponse.json({
      ok: true,
      exists: userDoc.exists,
      user: userDoc.exists ? userDoc.data() : null
    });
    
  } catch (error: any) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to check user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

