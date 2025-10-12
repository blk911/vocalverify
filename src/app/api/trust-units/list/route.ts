import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json({ error: 'Member code is required' }, { status: 400 });
    }

    const db = getDb();
    const trustUnitsRef = db.collection('trustUnits');
    
    // ✅ FIXED: Trust units have a 'members' array, not 'memberId'
    const snapshot = await trustUnitsRef.where('members', 'array-contains', memberCode).get();

    const trustUnits = [];
    snapshot.forEach((doc) => {
      trustUnits.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${trustUnits.length} trust units for ${memberCode}`);

    return NextResponse.json({ ok: true, trustUnits });
  } catch (error) {
    console.error('Error fetching trust units:', error);
    return NextResponse.json({ error: 'Failed to fetch trust units' }, { status: 500 });
  }
}
