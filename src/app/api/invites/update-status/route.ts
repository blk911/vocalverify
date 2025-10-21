import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { inviteId, status } = await req.json();

    if (!inviteId || !status) {
      return NextResponse.json(
        { ok: false, error: 'Invite ID and status are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Update invite status
    await db.collection('invites').doc(inviteId).update({
      status: status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: 'Invite status updated successfully',
      invite: {
        id: inviteId,
        status: status,
      },
    });
  } catch (error: any) {
    console.error('Error updating invite status:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update invite status' },
      { status: 500 }
    );
  }
}
