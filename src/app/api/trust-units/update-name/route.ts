import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { unitId, tuName, memberCode } = await request.json();

    if (!unitId || !tuName || !memberCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: unitId, tuName, memberCode',
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify the member has access to this TU
    const tuDoc = await db.collection('trustUnits').doc(unitId).get();
    if (!tuDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Trust Unit not found' },
        { status: 404 }
      );
    }

    const tuData = tuDoc.data();
    const memberCodes = tuData?.memberCodes || [];

    // Check if member is in this TU
    if (!memberCodes.includes(memberCode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not authorized to update this Trust Unit',
        },
        { status: 403 }
      );
    }

    // Update the TU name
    await db.collection('trustUnits').doc(unitId).update({
      tuName: tuName.trim(),
      updatedAt: new Date(),
    });

    console.log(`[TU-UPDATE] Updated TU ${unitId} name to: ${tuName}`);

    return NextResponse.json({
      success: true,
      message: 'Trust Unit name updated successfully',
      tuName: tuName.trim(),
    });
  } catch (error: any) {
    console.error('[TU-UPDATE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
