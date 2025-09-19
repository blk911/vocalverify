export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { isE164US } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const { phoneE164 } = await req.json();

    if (!phoneE164 || !isE164US(phoneE164)) {
      return NextResponse.json(
        { error: "Valid phoneE164 required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, phoneE164);
    const rateLimitResult = rateLimit(rateLimitKey, 5);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const now = Date.now();
    const userId = phoneE164; // Use phone as user ID for simplicity

    // Upsert user with status pending
    await db.collection("users").doc(userId).set(
      {
        phoneE164,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ userId });
  } catch (error: any) {
    console.error("User pending creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}












