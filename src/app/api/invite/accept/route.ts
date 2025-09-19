export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { rateLimit, getRateLimitKey } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Valid token required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, token);
    const rateLimitResult = rateLimit(rateLimitKey, 5);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get invite document
    const inviteDoc = await db.collection("invites").doc(token).get();
    
    if (!inviteDoc.exists) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 400 }
      );
    }

    const inviteData = inviteDoc.data()!;
    const now = Date.now();

    // Check if expired
    if (now > inviteData.expiresAt) {
      return NextResponse.json(
        { error: "Invite token has expired" },
        { status: 400 }
      );
    }

    // Check if already consumed
    if (inviteData.consumedAt) {
      return NextResponse.json(
        { error: "Invite token has already been used" },
        { status: 400 }
      );
    }

    const userId = inviteData.targetUserId || inviteData.targetPhoneE164;

    // Ensure user exists and set status to invited
    await db.collection("users").doc(userId).set(
      {
        phoneE164: inviteData.targetPhoneE164,
        status: "invited",
        invitedAt: inviteData.createdAt,
        updatedAt: now,
      },
      { merge: true }
    );

    // Mark invite as consumed
    await db.collection("invites").doc(token).update({
      consumedAt: now,
    });

    return NextResponse.json({ userId });
  } catch (error: any) {
    console.error("Invite accept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}












