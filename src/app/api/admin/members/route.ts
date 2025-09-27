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
      name: (user as any).fullName || (user as any).name || 'Unknown',
      phone: (user as any).phone || (user as any).memberCode || 'N/A',
      memberCode: (user as any).memberCode || (user as any).phone || 'N/A',
      status: (user as any).status || 'unknown',
      hasVoice: (user as any).hasVoice || false,
      profilePicture: (user as any).profilePicture || '',
      createdAt: (user as any).createdAt || new Date().toISOString()
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
      name: (user as any).fullName || (user as any).name || 'Unknown',
      phone: (user as any).phone || (user as any).memberCode || 'N/A',
      memberCode: (user as any).memberCode || (user as any).phone || 'N/A',
      status: (user as any).status || 'unknown',
      hasVoice: (user as any).hasVoice || false,
      profilePicture: (user as any).profilePicture || '',
      createdAt: (user as any).createdAt || new Date().toISOString()
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
