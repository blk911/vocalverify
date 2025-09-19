export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { isE164US } from "@/lib/phone";
import { randomBytes } from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.SELFTEST_ADMIN_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phoneE164 } = await req.json();

    if (!phoneE164 || !isE164US(phoneE164)) {
      return NextResponse.json(
        { error: "Valid phoneE164 required" },
        { status: 400 }
      );
    }

    // Rate limiting by creator (admin)
    const rateLimitKey = getRateLimitKey(req, "admin");
    const rateLimitResult = rateLimit(rateLimitKey, 20);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days
    const token = randomBytes(16).toString("base64url");
    const userId = phoneE164; // Use phone as user ID

    // Create/update user with status invited
    await db.collection("users").doc(userId).set(
      {
        phoneE164,
        status: "invited",
        invitedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // Create invite document
    await db.collection("invites").doc(token).set({
      token,
      targetPhoneE164: phoneE164,
      createdBy: "admin", // In real app, this would be the admin user ID
      createdAt: now,
      expiresAt,
      targetUserId: userId,
    });

    const link = `/accept?token=${token}`;

    return NextResponse.json({ token, link });
  } catch (error: any) {
    console.error("Invite creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}












