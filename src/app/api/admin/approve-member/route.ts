import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

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

    // Update member status to registered
    await db.collection("users").doc(memberCode).update({
      status: "registered",
      approvedAt: new Date(),
      approvedBy: "admin"
    });

    return NextResponse.json({
      ok: true,
      message: "Member approved successfully"
    });

  } catch (error) {
    console.error("Error approving member:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}







