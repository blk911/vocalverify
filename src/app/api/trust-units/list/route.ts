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

    // Get trust units where member is a participant
    const trustUnitsSnapshot = await db
      .collection('trustUnits')
      .where('memberCodes', 'array-contains', memberCode)
      .get();

    const trustUnits = trustUnitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('✅ [TU-LIST] Found trust units:', {
      memberCode,
      count: trustUnits.length
    });

    return NextResponse.json({
      ok: true,
      trustUnits,
      count: trustUnits.length,
    });
  } catch (error: any) {
    console.error('❌ [TU-LIST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list trust units' },
      { status: 500 }
    );
  }
}