export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * POST /api/trust/bonds/reject
 * Reject a pending trust bond request
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('API Request: POST /api/trust/bonds/reject', 'API');

    const body = await req.json();
    const { bondId, memberCode, reason } = body;

    // Validate required fields
    if (!bondId || !memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: bondId, memberCode' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the bond
    const bondDoc = await db.collection('trustBonds').doc(bondId).get();

    if (!bondDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Trust bond not found' },
        { status: 404 }
      );
    }

    const bondData = bondDoc.data();

    // Verify the rejecting member is the recipient
    if (bondData?.toMemberCode !== memberCode) {
      return NextResponse.json(
        {
          ok: false,
          error: 'You are not authorized to reject this trust bond',
        },
        { status: 403 }
      );
    }

    // Check if already accepted or rejected
    if (bondData?.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Trust bond is already ${bondData?.status}` },
        { status: 400 }
      );
    }

    // Update bond status to rejected
    await bondDoc.ref.update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason || 'No reason provided',
      updatedAt: new Date(),
    });

    logger.info(`Trust bond rejected: ${bondId}`, 'TrustBonds', {
      fromMemberCode: bondData?.fromMemberCode,
      toMemberCode: bondData?.toMemberCode,
      reason,
    });

    return NextResponse.json({
      ok: true,
      bond: {
        id: bondId,
        status: 'rejected',
        ...bondData,
      },
      message: 'Trust bond rejected',
    });
  } catch (error: any) {
    logger.error('Error rejecting trust bond', error, 'TrustBonds');
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to reject trust bond',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

























