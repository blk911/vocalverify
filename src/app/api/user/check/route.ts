import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Name parameter required", code: "MISSING_NAME" },
        { status: 400 }
      );
    }
    
    // Search for user by name
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('name', '==', name.trim()).get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        ok: true,
        exists: false,
        user: null
      });
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    return NextResponse.json({
      ok: true,
      exists: true,
      user: userData
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to check user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

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
    
    return NextResponse.json({
      ok: true,
      exists: userDoc.exists,
      user: userDoc.exists ? userDoc.data() : null
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to check user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

