import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { logTUUpdate } from '@/lib/telemetry';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🔥🔥🔥 [TU-WAIT] API CALLED 🔥🔥🔥');
    const { unitId, memberCode } = await req.json();

    console.log('[TU-WAIT] Request:', { unitId, memberCode });

    if (!unitId || !memberCode) {
      console.log('[TU-WAIT] ❌ Missing required fields');
      return NextResponse.json(
        { ok: false, error: 'Unit ID and member code are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the Trust Unit
    const unitDoc = await db.collection('trustUnits').doc(unitId).get();

    if (!unitDoc.exists) {
      console.log('[TU-WAIT] ❌ Trust Unit not found');
      return NextResponse.json(
        { ok: false, error: 'Trust Unit not found' },
        { status: 404 }
      );
    }

    const unitData = unitDoc.data();
    if (!unitData) {
      return NextResponse.json(
        { ok: false, error: 'Trust Unit data not found' },
        { status: 404 }
      );
    }
    const members = unitData.members || [];

    // ✅ Idempotent: Check if already waiting
    const memberIndex = members.findIndex(
      (m: any) => (typeof m === 'string' ? m : m.memberCode) === memberCode
    );

    if (memberIndex === -1) {
      console.log('[TU-WAIT] ❌ Member not in TU');
      return NextResponse.json(
        { ok: false, error: 'Member not found in Trust Unit' },
        { status: 404 }
      );
    }

    const currentMember = members[memberIndex];
    const currentStatus =
      typeof currentMember === 'string' ? null : currentMember.status;

    if (currentStatus === 'waiting') {
      console.log('[TU-WAIT] ℹ️ Member already waiting (idempotent)');
      return NextResponse.json({
        ok: true,
        message: 'Already in waiting status',
      });
    }

    // Update the member's status to waiting
    const updatedMembers = members.map((m: any, idx: number) => {
      if (idx === memberIndex) {
        return typeof m === 'string'
          ? { memberCode: m, status: 'waiting' }
          : { ...m, status: 'waiting' };
      }
      return m;
    });

    await unitDoc.ref.update({
      members: updatedMembers,
      updatedAt: new Date(),
    });

    console.log(
      `✅ [TU-WAIT] Member ${memberCode} set status to waiting in TU ${unitId}`
    );

    // Log telemetry
    logTUUpdate(unitId, 'member_waiting', memberCode);

    return NextResponse.json({
      ok: true,
      message: 'Status updated to waiting successfully',
    });
  } catch (error: any) {
    console.error('❌ [TU-WAIT] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
