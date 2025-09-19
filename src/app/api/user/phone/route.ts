import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\+1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone", code: "INVALID_PHONE" },
        { status: 400 }
      );
    }

    const userId = phone; // phone as doc id
    await db.collection("users").doc(userId).set(
      {
        phone,
        createdAt: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("Phone save error", err);
    return NextResponse.json(
      { ok: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}













