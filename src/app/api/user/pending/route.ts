import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('status', '==', 'pending').get();
    
    const pendingUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      ok: true,
      users: pendingUsers,
      count: pendingUsers.length
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to get pending users", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

