import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    
    // Get NF archive from Firestore
    const archiveSnapshot = await db.collection('nfArchive')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const archive = [];
    archiveSnapshot.docs.forEach(doc => {
      archive.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      ok: true,
      archive: archive,
      count: archive.length
    });

  } catch (error: any) {
    console.error('Error fetching NF archive:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch NF archive" },
      { status: 500 }
    );
  }
}
