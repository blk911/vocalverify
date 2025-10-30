import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, description, memberCodes, creatorCode } = await req.json();

    // Validate required fields
    if (!name || !memberCodes || !Array.isArray(memberCodes) || memberCodes.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Name and member codes are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify all members exist
    const memberChecks = await Promise.all(
      memberCodes.map(async (memberCode: string) => {
        const memberDoc = await db.collection('users').doc(memberCode).get();
        return { memberCode, exists: memberDoc.exists };
      })
    );

    const missingMembers = memberChecks.filter(check => !check.exists);
    if (missingMembers.length > 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Some members not found', 
          missingMembers: missingMembers.map(m => m.memberCode)
        },
        { status: 404 }
      );
    }

    // Create trust unit
    const trustUnitData = {
      name: name.trim(),
      description: description?.trim() || '',
      memberCodes,
      creatorCode: creatorCode || memberCodes[0],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const unitRef = await db.collection('trustUnits').add(trustUnitData);

    console.log('✅ [TU-CREATE] Trust unit created:', {
      id: unitRef.id,
      name: trustUnitData.name,
      members: memberCodes.length
    });

    return NextResponse.json({
      ok: true,
      unitId: unitRef.id,
      message: 'Trust unit created successfully',
      unit: {
        id: unitRef.id,
        ...trustUnitData,
      },
    });
  } catch (error: any) {
    console.error('❌ [TU-CREATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create trust unit' },
      { status: 500 }
    );
  }
}
