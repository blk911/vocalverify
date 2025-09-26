import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing memberCode" },
        { status: 400 }
      );
    }
    
    console.log('Admin delete-user API called for:', memberCode);
    
    // Delete user from Firestore
    await db.collection('users').doc(memberCode).delete();
    
    console.log(`Deleted user: ${memberCode}`);

    return NextResponse.json({
      ok: true,
      message: "User deleted successfully"
    });

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
