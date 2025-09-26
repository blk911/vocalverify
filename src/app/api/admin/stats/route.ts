import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log('Admin stats API called');
    
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
      if (!user.createdAt) return false;
      
      // Handle different date formats
      let userDate;
      if (typeof user.createdAt === 'string') {
        userDate = new Date(user.createdAt);
      } else if (typeof user.createdAt === 'number') {
        userDate = new Date(user.createdAt);
      } else if (user.createdAt.toDate) {
        // Firebase Timestamp
        userDate = user.createdAt.toDate();
      } else {
        userDate = new Date(user.createdAt);
      }
      
      return userDate >= today;
    }).length;

    const pendingMembers = users.filter(user => user.status === 'pending').length;
    const registeredMembers = users.filter(user => user.status === 'registered').length;

    const stats = {
      totalMembers,
      newToday,
      pendingMembers,
      registeredMembers
    };

    console.log('Stats calculated:', stats);

    return NextResponse.json({
      ok: true,
      stats
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
