import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get all members from database
    const usersSnapshot = await db.collection("users").get();
    
    const members = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.fullName || data.name || null,
        phone: doc.id, // Member code is the document ID
        status: data.status || 'unknown',
        voiceRecorded: data.voiceRecorded || false,
        picture: data.picture || false,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || null
      };
    });

    // Sort by creation date (newest first)
    members.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      
      // Handle both Date objects and timestamps
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      
      return bTime - aTime;
    });

    return NextResponse.json({
      ok: true,
      members
    });

  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}





