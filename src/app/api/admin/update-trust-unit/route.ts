import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function PUT(request: NextRequest) {
  try {
    const { unitId, memberCodes, tuName } = await request.json();

    if (!unitId || !memberCodes || !Array.isArray(memberCodes)) {
      return NextResponse.json(
        { error: 'Unit ID and member codes are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the Trust Unit
    const tuDoc = await db.collection('trustUnits').doc(unitId).get();
    if (!tuDoc.exists) {
      return NextResponse.json(
        { error: 'Trust Unit not found' },
        { status: 404 }
      );
    }

    const tuData = tuDoc.data();
    const oldMemberCodes = tuData?.memberCodes || [];

    // Fetch member data for new members
    const memberDocs = await Promise.all(
      memberCodes.map(code => db.collection('users').doc(code).get())
    );

    const members = memberDocs
      .filter(doc => doc.exists)
      .map(doc => {
        const data = doc.data();
        return {
          memberCode: doc.id,
          name: data?.name || data?.fullName || 'Member',
          status: 'pending_connection',
          profilePicture: data?.profilePicture || null,
        };
      });

    // Update the Trust Unit
    await db
      .collection('trustUnits')
      .doc(unitId)
      .update({
        memberCodes,
        members,
        tuName: tuName || tuData?.tuName,
        size: members.length,
        updatedAt: new Date(),
      });

    // Update users' trustUnits arrays
    const allUsersSnapshot = await db.collection('users').get();
    const batch = db.batch();

    allUsersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      let updatedTrustUnits = userData.trustUnits || [];

      // Remove old members
      oldMemberCodes.forEach((oldCode: string) => {
        if (!memberCodes.includes(oldCode)) {
          // Don't remove the unit from users who are no longer members
          // They'll be handled by the new member list
        }
      });

      // Add new members
      memberCodes.forEach((newCode: string) => {
        if (!updatedTrustUnits.includes(unitId)) {
          updatedTrustUnits.push(unitId);
        }
      });

      // Remove duplicates
      updatedTrustUnits = [...new Set(updatedTrustUnits)];

      batch.update(doc.ref, { trustUnits: updatedTrustUnits });
    });

    await batch.commit();

    console.log(
      `✅ Updated Trust Unit ${unitId} with ${members.length} members`
    );

    return NextResponse.json({
      ok: true,
      message: `Trust Unit ${unitId} updated successfully`,
      unitId,
      memberCount: members.length,
    });
  } catch (error: any) {
    console.error('Error updating Trust Unit:', error);
    return NextResponse.json(
      {
        error: 'Failed to update Trust Unit',
      },
      { status: 500 }
    );
  }
}
