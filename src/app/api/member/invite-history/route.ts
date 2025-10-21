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

    // Get member's invite history
    const invitesSnapshot = await db
      .collection('invites')
      .where('inviterUid', '==', memberCode)
      .limit(50)
      .get();

    const invites: any[] = [];
    invitesSnapshot.docs.forEach(doc => {
      invites.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      ok: true,
      invites: invites,
      count: invites.length,
    });
  } catch (error: any) {
    console.error('Error fetching invite history:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch invite history' },
      { status: 500 }
    );
  }
}
