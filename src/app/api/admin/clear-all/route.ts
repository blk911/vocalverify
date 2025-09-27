import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    let deletedCount = 0;
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    
    return NextResponse.json({
      ok: true,
      deletedCount
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to clear members" },
      { status: 500 }
    );
  }
}
