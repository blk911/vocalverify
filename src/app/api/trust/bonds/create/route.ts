export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * POST /api/trust/bonds/create
 * Create a new trust bond between two members
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('API Request: POST /api/trust/bonds/create', 'API');

    const body = await req.json();
    const { fromMemberCode, toMemberCode, message } = body;

    // Validate required fields
    if (!fromMemberCode || !toMemberCode) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields: fromMemberCode, toMemberCode',
        },
        { status: 400 }
      );
    }

    // Prevent self-bonding
    if (fromMemberCode === toMemberCode) {
      return NextResponse.json(
        { ok: false, error: 'Cannot create trust bond with yourself' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if both members exist
    const fromMemberDoc = await db
      .collection('users')
      .doc(fromMemberCode)
      .get();
    const toMemberDoc = await db.collection('users').doc(toMemberCode).get();

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

    // Check if bond already exists
    const existingBond = await db
      .collection('trustBonds')
      .where('fromMemberCode', '==', fromMemberCode)
      .where('toMemberCode', '==', toMemberCode)
      .limit(1)
      .get();

    if (!existingBond.empty) {
      const bondData = existingBond.docs[0].data();
      return NextResponse.json(
        {
          ok: false,
          error: 'Trust bond already exists',
          bond: {
            id: existingBond.docs[0].id,
            status: bondData.status,
          },
        },
        { status: 409 }
      );
    }

    // Create trust bond
    const fromMemberData = fromMemberDoc.data();
    const toMemberData = toMemberDoc.data();

    const bondData = {
      fromMemberCode,
      toMemberCode,
      fromMemberName: fromMemberData?.name || 'Unknown',
      toMemberName: toMemberData?.name || 'Unknown',
      status: 'pending',
      message: message || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bondRef = await db.collection('trustBonds').add(bondData);

    logger.info(`Trust bond created: ${bondRef.id}`, 'TrustBonds', {
      fromMemberCode,
      toMemberCode,
    });

    return NextResponse.json({
      ok: true,
      bond: {
        id: bondRef.id,
        ...bondData,
      },
      message: 'Trust bond request sent successfully',
    });
  } catch (error: any) {
    logger.error('Error creating trust bond', error, 'TrustBonds');
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create trust bond',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


