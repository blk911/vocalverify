import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Member code is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get user profile picture
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    return NextResponse.json({
      ok: true,
      profilePicture: userData?.profilePicture || null,
      hasProfilePicture: Boolean(userData?.profilePicture),
    });
  } catch (error: any) {
    console.error('Error fetching profile picture:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch profile picture' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { memberCode, profilePicture } = await req.json();

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Member code is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update user profile picture
    await db
      .collection('users')
      .doc(memberCode)
      .update({
        profilePicture: profilePicture || null,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({
      ok: true,
      message: 'Profile picture updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating profile picture:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update profile picture' },
      { status: 500 }
    );
  }
}
