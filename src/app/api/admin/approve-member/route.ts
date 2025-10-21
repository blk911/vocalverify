import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { memberCode } = await req.json();

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Missing memberCode' },
        { status: 400 }
      );
    }

    // Update user status to registered
    const db = getDb();
    await db.collection('users').doc(memberCode).update({
      status: 'registered',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: 'User approved successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'Failed to approve user' },
      { status: 500 }
    );
  }
}
