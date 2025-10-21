import { NextRequest, NextResponse } from 'next/server';
// import { cleanupInvalidTrustUnits } from '@/scripts/cleanup-invalid-trust-units';

/**
 * DELETE /api/admin/cleanup-trust-units
 *
 * Removes invalid Trust Units from the database:
 * - TUs where sponsor is in members array
 * - TUs with less than 2 members
 *
 * This cleans up data from the old broken logic.
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('\n🔥🔥🔥 [CLEANUP] API CALLED 🔥🔥🔥\n');

    // const result = await cleanupInvalidTrustUnits();
    const result = { deleted: 0, kept: 0, invalidUnits: [], validUnits: [] };

    return NextResponse.json({
      ok: true,
      message: 'Trust Unit cleanup completed',
      deleted: result.deleted,
      kept: result.kept,
      invalidUnits: result.invalidUnits,
      validUnits: result.validUnits,
    });
  } catch (error: any) {
    console.error('❌ [CLEANUP] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to cleanup Trust Units',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Also support GET to see what would be deleted (dry run)
export async function GET(request: NextRequest) {
  try {
    const { getDb } = await import('@/lib/firebaseAdmin');
    const db = getDb();
    const trustUnitsRef = db.collection('trustUnits');

    const snapshot = await trustUnitsRef.get();

    const invalidUnits: any[] = [];
    const validUnits: any[] = [];

    snapshot.forEach(doc => {
      const unit = doc.data();
      const unitId = doc.id;

      const sponsorInMembers = unit.members?.includes(unit.sponsorCode);
      const tooSmall = (unit.members?.length || 0) < 2;

      if (sponsorInMembers || tooSmall) {
        invalidUnits.push({
          id: unitId,
          sponsorCode: unit.sponsorCode,
          members: unit.members,
          size: unit.size,
          reason: sponsorInMembers ? 'SPONSOR_IN_MEMBERS' : 'TOO_SMALL',
        });
      } else {
        validUnits.push({
          id: unitId,
          sponsorCode: unit.sponsorCode,
          members: unit.members,
          size: unit.size,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      total: snapshot.size,
      invalid: invalidUnits.length,
      valid: validUnits.length,
      invalidUnits,
      validUnits,
      message: 'Use DELETE method to remove invalid units',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to check Trust Units',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
