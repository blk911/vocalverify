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
    const trustBondsRef = db.collection('trustBonds');
    
    // ✅ FIXED: Trust bonds have fromMemberCode/toMemberCode, not memberId
    // Get bonds where member is either sender or receiver
    const sentBondsSnapshot = await trustBondsRef.where('fromMemberCode', '==', memberCode).get();
    const receivedBondsSnapshot = await trustBondsRef.where('toMemberCode', '==', memberCode).get();

    const trustBonds = [];
    
    sentBondsSnapshot.forEach((doc) => {
      trustBonds.push({
        id: doc.id,
        direction: 'sent',
        ...doc.data()
      });
    });
    
    receivedBondsSnapshot.forEach((doc) => {
      trustBonds.push({
        id: doc.id,
        direction: 'received',
        ...doc.data()
      });
    });

    console.log(`✅ Found ${trustBonds.length} trust bonds for ${memberCode}`);

    return NextResponse.json({ ok: true, trustBonds });
  } catch (error) {
    console.error('Error fetching trust bonds:', error);
    return NextResponse.json({ error: 'Failed to fetch trust bonds' }, { status: 500 });
  }
}
