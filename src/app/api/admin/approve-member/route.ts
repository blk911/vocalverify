import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing memberCode" },
        { status: 400 }
      );
    }
    
    console.log('Admin approve-member API called for:', memberCode);
    
    // Update user status to registered
    await db.collection('users').doc(memberCode).update({
      status: 'registered',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Approved user: ${memberCode}`);

    return NextResponse.json({
      ok: true,
      message: "User approved successfully"
    });

  } catch (error: any) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to approve user" },
      { status: 500 }
    );
  }
}
