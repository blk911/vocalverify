import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('User phone lookup API called');
    
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Phone number required", code: "MISSING_PHONE" },
        { status: 400 }
      );
    }
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('phone', '==', phone).get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { ok: false, error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    const userDoc = snapshot.docs[0];
    return NextResponse.json({
      ok: true,
      user: userDoc.data()
    });
    
  } catch (error: any) {
    console.error('Error looking up user by phone:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to lookup user", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

