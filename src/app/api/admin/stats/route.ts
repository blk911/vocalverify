import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get total members count
    const usersSnapshot = await db.collection("users").get();
    const totalMembers = usersSnapshot.size;

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count new members today
    const newTodaySnapshot = await db.collection("users")
      .where("createdAt", ">=", today)
      .where("createdAt", "<", tomorrow)
      .get();
    const newToday = newTodaySnapshot.size;

    // Count pending members
    const pendingSnapshot = await db.collection("users")
      .where("status", "==", "pending")
      .get();
    const pendingMembers = pendingSnapshot.size;

    // Count registered members
    const registeredSnapshot = await db.collection("users")
      .where("status", "==", "registered")
      .get();
    const registeredMembers = registeredSnapshot.size;

    const stats = {
      totalMembers,
      newToday,
      pendingMembers,
      registeredMembers
    };

    return NextResponse.json({
      ok: true,
      stats
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}







