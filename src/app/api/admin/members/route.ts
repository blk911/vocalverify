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

    // Format members for admin dashboard
    const members = users.map(user => ({
      name: user.fullName || user.name || 'Unknown',
      phone: user.phone || user.memberCode || 'N/A',
      memberCode: user.memberCode || user.phone || 'N/A',
      status: user.status || 'unknown',
      hasVoice: user.hasVoice || false,
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt || new Date().toISOString()
    }));


    return NextResponse.json({
      ok: true,
      members
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Format members for admin dashboard
    const members = users.map(user => ({
      name: user.fullName || user.name || 'Unknown',
      phone: user.phone || user.memberCode || 'N/A',
      memberCode: user.memberCode || user.phone || 'N/A',
      status: user.status || 'unknown',
      hasVoice: user.hasVoice || false,
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt || new Date().toISOString()
    }));


    return NextResponse.json({
      ok: true,
      members
    });

  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
