import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate stats
    const totalMembers = users.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newToday = users.filter(user => {
      if (!(user as any).createdAt) return false;
      
      // Handle different date formats
      let userDate;
      if (typeof (user as any).createdAt === 'string') {
        userDate = new Date((user as any).createdAt);
      } else if (typeof (user as any).createdAt === 'number') {
        userDate = new Date((user as any).createdAt);
      } else if ((user as any).createdAt && (user as any).createdAt.toDate) {
        // Firebase Timestamp
        userDate = (user as any).createdAt.toDate();
      } else {
        userDate = new Date((user as any).createdAt);
      }
      
      return userDate >= today;
    }).length;

    const pendingMembers = users.filter(user => (user as any).status === 'pending').length;
    const registeredMembers = users.filter(user => (user as any).status === 'registered').length;

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

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
