import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId, fullName } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId", code: "NO_USERID" },
        { status: 400 }
      );
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid name", code: "INVALID_NAME" },
        { status: 400 }
      );
    }

    await db.collection("users").doc(userId).set(
      {
        fullName,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Name save error", err);
    return NextResponse.json(
      { ok: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}













