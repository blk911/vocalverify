import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    const status = searchParams.get('status');

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Member code parameter required' },
        { status: 400 }
      );
    }

    const db = getDb();
    let query = db.collection('trustBonds').where('memberCode', '==', memberCode);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const bonds = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      ok: true,
      bonds: bonds,
      count: bonds.length
    });
  } catch (error: any) {
    console.error('Error fetching trust bonds:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch trust bonds' },
      { status: 500 }
    );
  }
}
