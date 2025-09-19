export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { toE164US, isE164US } from "@/lib/phone";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone parameter required" },
        { status: 400 }
      );
    }

    const phoneE164 = toE164US(phone);
    if (!phoneE164 || !isE164US(phoneE164)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, phoneE164);
    const rateLimitResult = rateLimit(rateLimitKey, 10);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Query users by phoneE164
    const usersSnapshot = await db
      .collection("users")
      .where("phoneE164", "==", phoneE164)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ exists: false });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    return NextResponse.json({
      exists: true,
      status: userData.status,
      userId: userDoc.id,
    });
  } catch (error: any) {
    console.error("User lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}












