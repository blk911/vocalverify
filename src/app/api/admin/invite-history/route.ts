import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    // Get all invites from Firestore
    const invitesSnapshot = await db.collection('invites')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const invites: any[] = [];
    invitesSnapshot.docs.forEach(doc => {
      invites.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      ok: true,
      invites: invites,
      count: invites.length
    });

  } catch (error: any) {
    console.error('Error fetching invite history:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch invite history" },
      { status: 500 }
    );
  }
}
