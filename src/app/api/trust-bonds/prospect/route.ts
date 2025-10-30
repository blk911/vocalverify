import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { fromMemberCode, toMemberCode, message, type = 'sponsor' } = await req.json();

    // Validate required fields
    if (!fromMemberCode || !toMemberCode) {
      return NextResponse.json(
        { ok: false, error: 'From and to member codes are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify from member exists
    const fromMemberDoc = await db.collection('users').doc(fromMemberCode).get();
    if (!fromMemberDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'From member not found' },
        { status: 404 }
      );
    }

    const fromMemberData = fromMemberDoc.data();

    // Create TB prospect (toMemberCode may not exist yet)
    const prospectData = {
      fromMemberCode,
      toMemberCode,
      fromMemberName: fromMemberData?.name || 'Unknown',
      toMemberName: 'Pending Registration', // Will be updated when user registers
      message: message || 'Trust bond prospect created',
      type,
      status: 'prospect', // Special status for prospects
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prospectRef = await db.collection('trustBonds').add(prospectData);

    console.log('✅ [TB-PROSPECT] Trust bond prospect created:', {
      id: prospectRef.id,
      from: fromMemberData?.name,
      to: toMemberCode,
      status: 'prospect'
    });

    return NextResponse.json({
      ok: true,
      prospectId: prospectRef.id,
      message: 'Trust bond prospect created successfully',
      prospect: {
        id: prospectRef.id,
        ...prospectData,
      },
    });
  } catch (error: any) {
    console.error('❌ [TB-PROSPECT] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create trust bond prospect' },
      { status: 500 }
    );
  }
}
