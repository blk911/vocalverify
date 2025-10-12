import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode } = await req.json();
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get pending trust unit connections
    const connectionsSnapshot = await db.collection('trustConnections')
      .where('toMemberCode', '==', memberCode)
      .where('status', '==', 'pending')
      .limit(10)
      .get();
    
    const connections = [];
    connectionsSnapshot.docs.forEach(doc => {
      connections.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      ok: true,
      connections: connections,
      count: connections.length
    });

  } catch (error: any) {
    console.error('Error fetching trust unit connections:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch trust unit connections" },
      { status: 500 }
    );
  }
}


