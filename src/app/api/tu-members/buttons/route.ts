import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tuId = searchParams.get('tuId');

    if (!tuId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'TU ID is required',
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the specific Trust Unit
    const tuDoc = await db.collection('trustUnits').doc(tuId).get();

    if (!tuDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Trust Unit not found',
        },
        { status: 404 }
      );
    }

    const tuData = tuDoc.data();
    const memberCodes = tuData?.memberCodes || [];

    console.log('ðŸ” TU Member Codes:', memberCodes);

    // Remove duplicates and get member details for each unique member code
    const uniqueMemberCodes = [...new Set(memberCodes)]; // Remove duplicates
    console.log('ðŸ” Unique Member Codes:', uniqueMemberCodes);

    const memberButtons = await Promise.all(
      uniqueMemberCodes.map(async memberCode => {
        try {
          const userDoc = await db
            .collection('users')
            .doc(memberCode as string)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            return {
              memberCode,
              name: userData?.name || userData?.fullName || 'Member',
              isActive: Math.random() > 0.5, // Random for demo - TODO: implement real active status
              profilePicture: userData?.profilePicture || null,
            };
          }
          return null;
        } catch (error) {
          console.error('Error fetching member:', memberCode, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validMembers = memberButtons.filter(member => member !== null);
    console.log('ðŸ” Valid Members:', validMembers.length, validMembers);

    return NextResponse.json({
      ok: true,
      tuId,
      tuName: tuData?.tuName || 'Trust Unit',
      members: validMembers,
      count: validMembers.length,
    });
  } catch (error) {
    console.error('Error getting TU member buttons:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to get TU member buttons',
      },
      { status: 500 }
    );
  }
}

