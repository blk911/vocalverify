import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    console.log("Phone check received:", phone);
    
    // Extract digits and validate - phone IS the member code (10 digits)
    const memberCode = phone.replace(/\D/g, "");
    if (!phone || memberCode.length !== 10) {
      console.log("Invalid member code format:", phone, "digits:", memberCode);
      return NextResponse.json(
        { ok: false, error: "Invalid member code", code: "INVALID_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    console.log("Member code:", memberCode);


    // Check if member code exists in database
    const userDoc = await db.collection("users").doc(memberCode).get();
    
    if (!userDoc.exists) {
      // Phone not in DB - new user
      return NextResponse.json({
        ok: true,
        exists: false,
        status: "new",
        message: "New user - proceed with registration"
      });
    }

    const userData = userDoc.data();
    
    if (userData.status === "registered") {
      // Phone exists and user is registered
      return NextResponse.json({
        ok: true,
        exists: true,
        status: "registered",
        userId: memberCode,
        name: userData.fullName || "Member",
        message: "Registered member - redirect to dashboard"
      });
    }
    
    if (userData.status === "pending") {
      // Phone exists but user is pending
      return NextResponse.json({
        ok: true,
        exists: true,
        status: "pending",
        userId: memberCode,
        message: "Pending member - complete registration"
      });
    }

    // Default case
    return NextResponse.json({
      ok: true,
      exists: true,
      status: "unknown",
      userId: phone,
      message: "User exists with unknown status"
    });

  } catch (error) {
    console.error("Phone check error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
