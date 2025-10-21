import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Member code is required',
        },
        { status: 400 }
      );
    }

    // Check if user exists first
    const db = getDb();
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      // User doesn't exist, return empty vaults
      return NextResponse.json({
        ok: true,
        vaults: [],
        count: 0,
      });
    }

    // Get all vaults where the user is a participant
    const vaultsSnapshot = await db
      .collection('vaults')
      .where('participants', 'array-contains', memberCode)
      .orderBy('lastActivity', 'desc')
      .get();

    const vaults = [];

    for (const doc of vaultsSnapshot.docs) {
      try {
        const vaultData = doc.data();

        // Get participant details (handle orphaned participants gracefully)
        const participantDetails = [];
        if (
          vaultData &&
          vaultData.participants &&
          Array.isArray(vaultData.participants)
        ) {
          for (const participantCode of vaultData.participants) {
            if (participantCode !== memberCode) {
              try {
                const memberDoc = await db
                  .collection('users')
                  .doc(participantCode)
                  .get();
                if (memberDoc.exists) {
                  const memberData = memberDoc.data();
                  participantDetails.push({
                    memberCode: participantCode,
                    name:
                      memberData?.name || memberData?.displayName || 'Unknown',
                    profilePicture: memberData?.profilePicture || null,
                  });
                } else {
                  // Handle orphaned participant (user deleted but vault remains)
                  console.log(
                    `Orphaned participant ${participantCode} in vault ${doc.id}`
                  );
                  participantDetails.push({
                    memberCode: participantCode,
                    name: 'Deleted User',
                    profilePicture: null,
                  });
                }
              } catch (error) {
                console.error(
                  `Error fetching member ${participantCode}:`,
                  error
                );
              }
            }
          }
        }

        vaults.push({
          id: doc.id,
          type: vaultData?.type || 'unknown',
          creatorId: vaultData?.creatorId || null,
          participants: vaultData?.participants || [],
          participantDetails,
          tuId: vaultData?.tuId || null,
          status: vaultData?.status || 'active',
          createdAt: vaultData?.createdAt || null,
          lastActivity: vaultData?.lastActivity || null,
          messageCount: vaultData?.messageCount || 0,
        });
      } catch (vaultError) {
        console.error(`Error processing vault ${doc.id}:`, vaultError);
        // Skip this vault and continue
      }
    }

    return NextResponse.json({
      ok: true,
      vaults,
      count: vaults.length,
    });
  } catch (error) {
    console.error('Error fetching vaults:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch vaults',
      },
      { status: 500 }
    );
  }
}
