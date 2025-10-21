import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json(
        { error: 'Member code is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const trustUnitsRef = db.collection('trustUnits');

    // ✅ Get TUs where user is a member (using memberCodes array for object-based members)
    const memberSnapshot = await trustUnitsRef
      .where('memberCodes', 'array-contains', memberCode)
      .get();

    // ✅ Get TUs where user is the sponsor
    const sponsorSnapshot = await trustUnitsRef
      .where('sponsorCode', '==', memberCode)
      .get();

    const trustUnitsMap = new Map();

    // Add member TUs
    memberSnapshot.forEach(doc => {
      const data = doc.data();
      trustUnitsMap.set(doc.id, {
        id: doc.id,
        unitId: doc.id, // ✅ Add unitId for modal
        tuName: data.tuName || null, // ✅ Explicitly include TU name
        sponsorCode: data.sponsorCode || null,
        sponsorName: data.sponsorName || null,
        ...data,
        viewerRole: 'member',
      });
    });

    // Add sponsor TUs (avoid duplicates)
    sponsorSnapshot.forEach(doc => {
      if (!trustUnitsMap.has(doc.id)) {
        const data = doc.data();
        trustUnitsMap.set(doc.id, {
          id: doc.id,
          unitId: doc.id, // ✅ Add unitId for modal
          tuName: data.tuName || null, // ✅ Explicitly include TU name
          sponsorCode: data.sponsorCode || null,
          sponsorName: data.sponsorName || null,
          ...data,
          viewerRole: 'sponsor',
        });
      }
    });

    const trustUnits = Array.from(trustUnitsMap.values());
    console.log(
      `✅ Found ${trustUnits.length} trust units for ${memberCode} (${memberSnapshot.size} as member, ${sponsorSnapshot.size} as sponsor)`
    );

    // ✅ Group by rootSponsorId for easier UI rendering
    const groupedByRoot = trustUnits.reduce((acc: any, tu: any) => {
      const root = tu.rootSponsorId || tu.sponsorCode || 'unknown';
      if (!acc[root]) {
        acc[root] = [];
      }
      acc[root].push(tu);
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      trustUnits,
      groupedByRoot,
      totalCount: trustUnits.length,
      byRoot: Object.keys(groupedByRoot).length,
    });
  } catch (error) {
    console.error('Error fetching trust units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust units' },
      { status: 500 }
    );
  }
}
