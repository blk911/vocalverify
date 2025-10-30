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

    // Verify both members exist
    const [fromMemberDoc, toMemberDoc] = await Promise.all([
      db.collection('users').doc(fromMemberCode).get(),
      db.collection('users').doc(toMemberCode).get(),
    ]);

    if (!fromMemberDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'From member not found' },
        { status: 404 }
      );
    }

    if (!toMemberDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'To member not found' },
        { status: 404 }
      );
    }

    const fromMemberData = fromMemberDoc.data();
    const toMemberData = toMemberDoc.data();

    // Check if trust bond already exists
    const existingBondSnapshot = await db
      .collection('trustBonds')
      .where('fromMemberCode', '==', fromMemberCode)
      .where('toMemberCode', '==', toMemberCode)
      .get();

    if (!existingBondSnapshot.empty) {
      return NextResponse.json(
        { ok: false, error: 'Trust bond already exists' },
        { status: 409 }
      );
    }

    // Create trust bond
    const trustBondData = {
      fromMemberCode,
      toMemberCode,
      fromMemberName: fromMemberData?.name || 'Unknown',
      toMemberName: toMemberData?.name || 'Unknown',
      message: message || 'Trust bond created',
      type,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bondRef = await db.collection('trustBonds').add(trustBondData);

    console.log('✅ [TB-CREATE] Trust bond created:', {
      id: bondRef.id,
      from: fromMemberData?.name,
      to: toMemberData?.name,
      status: 'pending'
    });

    return NextResponse.json({
      ok: true,
      bondId: bondRef.id,
      message: 'Trust bond created successfully',
      bond: {
        id: bondRef.id,
        ...trustBondData,
      },
    });
  } catch (error: any) {
    console.error('❌ [TB-CREATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create trust bond' },
      { status: 500 }
    );
  }
}
