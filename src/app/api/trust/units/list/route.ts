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
    let query = db.collection('trustUnits').where('members', 'array-contains', memberCode);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const units = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      ok: true,
      units: units,
      count: units.length
    });
  } catch (error: any) {
    console.error('Error fetching trust units:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch trust units' },
      { status: 500 }
    );
  }
}
