import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code required", code: "MISSING_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    const userRef = db.collection('users').doc(memberCode);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      user: userDoc.data()
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to lookup user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

