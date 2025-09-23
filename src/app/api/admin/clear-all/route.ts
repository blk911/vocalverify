import { db } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    console.log('Clearing all registered members...');

    // Get all users from database
    const usersSnapshot = await db.collection("users").get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({
        ok: true,
        message: "No members to clear",
        deletedCount: 0
      });
    }

    // Delete all user documents
    const batch = db.batch();
    let deletedCount = 0;

    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();

    // Also clear all voice prints
    const voicePrintsSnapshot = await db.collection('voicePrints').get();
    if (!voicePrintsSnapshot.empty) {
      const voiceBatch = db.batch();
      voicePrintsSnapshot.docs.forEach(doc => {
        voiceBatch.delete(doc.ref);
      });
      await voiceBatch.commit();
    }

    console.log(`Cleared ${deletedCount} members and all voice prints`);

    return NextResponse.json({
      ok: true,
      message: `Successfully cleared ${deletedCount} members`,
      deletedCount: deletedCount
    });

  } catch (error) {
    console.error("Clear all members error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to clear members" },
      { status: 500 }
    );
  }
}
