import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode, targetMemberCode } = await req.json();
    
    if (!memberCode || !targetMemberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code and target member code are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Create trust unit connection
    const connectionData = {
      fromMemberCode: memberCode,
      toMemberCode: targetMemberCode,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const connectionRef = await db.collection('trustConnections').add(connectionData);

    return NextResponse.json({
      ok: true,
      message: "Trust unit connection initiated",
      connection: {
        id: connectionRef.id,
        ...connectionData
      }
    });

  } catch (error: any) {
    console.error('Error creating trust unit connection:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to create trust unit connection" },
      { status: 500 }
    );
  }
}


