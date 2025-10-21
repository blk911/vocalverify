import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import {
  createOrGetSameSponsorTU,
  createOrGetTriangleCloseTU,
} from '@/lib/trustUnits';
import { getFeatureFlags, logFeatureFlags } from '@/lib/featureFlags';

export const runtime = 'nodejs';

/**
 * Find members who have actual Trust Bonds between them
 * Only members with real connections should be in Trust Units
 */
async function findConnectedMembers(memberCodes: string[]): Promise<string[]> {
  const db = getDb();
  const connectedMembers = new Set<string>();

  // Check each pair of members for Trust Bonds
  for (let i = 0; i < memberCodes.length; i++) {
    for (let j = i + 1; j < memberCodes.length; j++) {
      const memberA = memberCodes[i];
      const memberB = memberCodes[j];

      // Check if there's a Trust Bond between these two members
      const bondQuery = await db
        .collection('trustBonds')
        .where('fromMemberCode', 'in', [memberA, memberB])
        .where('toMemberCode', 'in', [memberA, memberB])
        .where('status', '==', 'accepted')
        .get();

      if (!bondQuery.empty) {
        // These two members have a Trust Bond, add them to connected set
        connectedMembers.add(memberA);
        connectedMembers.add(memberB);
        console.log(
          `[FIND-CONNECTED] Found Trust Bond: ${memberA} ↔ ${memberB}`
        );
      }
    }
  }

  return Array.from(connectedMembers);
}

export async function POST(req: NextRequest) {
  try {
    console.log('\n🔥🔥🔥 [UPLOAD-PICTURE] API CALLED 🔥🔥🔥');
    const { memberCode, profilePicture } = await req.json();
    console.log('[UPLOAD-PICTURE] memberCode:', memberCode);

    if (!memberCode || !profilePicture) {
      console.log('[UPLOAD-PICTURE] ❌ Missing required fields');
      return NextResponse.json(
        { ok: false, error: 'Member code and profile picture are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get user data to find sponsor
    console.log('[UPLOAD-PICTURE] Fetching user data...');
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      console.log('[UPLOAD-PICTURE] ❌ User not found');
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const sponsorId = userData?.sponsorId;
    const sponsorMemberCode = userData?.sponsorMemberCode || sponsorId;

    console.log('[UPLOAD-PICTURE] User data:', {
      name: userData?.name,
      sponsorId,
      sponsorMemberCode,
      sponsorName: userData?.sponsorName,
      status: userData?.status,
    });

    // Update user with profile picture and complete registration
    console.log('[UPLOAD-PICTURE] Updating user status to registered...');
    await db.collection('users').doc(memberCode).update({
      profilePicture: profilePicture,
      selfieUploadedAt: new Date().toISOString(),
      status: 'registered', // Complete registration when selfie uploaded
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `✅ [UPLOAD-PICTURE] User ${memberCode} registration completed with selfie upload`
    );

    // ⚡ CRITICAL: Create sponsor divisions (trust unit + trust bond)
    console.log('[UPLOAD-PICTURE] Checking sponsor eligibility...');
    console.log('[UPLOAD-PICTURE] sponsorId:', sponsorId);
    console.log(
      '[UPLOAD-PICTURE] Is admin sponsor?',
      sponsorId === '0000000000'
    );

    if (sponsorId && sponsorId !== '0000000000') {
      console.log(
        `\n🔥🔥🔥 [UPLOAD-PICTURE] CREATING SPONSOR DIVISIONS 🔥🔥🔥`
      );
      console.log(`🔗 Member: ${memberCode} (${userData?.name})`);
      console.log(
        `🔗 Sponsor: ${sponsorMemberCode} (${userData?.sponsorName})`
      );

      try {
        // 1. Create trust bond from sponsor to new member
        console.log('[UPLOAD-PICTURE] Step 1: Creating trust bond...');
        const bondData = {
          fromMemberCode: sponsorMemberCode,
          toMemberCode: memberCode,
          fromMemberName: userData?.sponsorName || 'Sponsor',
          toMemberName: userData?.name || 'Member',
          status: 'accepted', // Auto-accept for sponsor relationships
          message: 'Sponsor relationship',
          createdAt: new Date(),
          acceptedAt: new Date(),
          updatedAt: new Date(),
          type: 'sponsor', // Mark as sponsor bond
        };

        const bondRef = await db.collection('trustBonds').add(bondData);
        console.log(`✅ [UPLOAD-PICTURE] Trust bond created: ${bondRef.id}`);
        console.log(
          `✅ [UPLOAD-PICTURE] Bond: ${sponsorMemberCode} → ${memberCode}`
        );

        // 2. Create trust connection (bidirectional)
        console.log('[UPLOAD-PICTURE] Step 2: Creating trust connection...');
        const connectionData = {
          member1Code: sponsorMemberCode,
          member2Code: memberCode,
          member1Name: userData?.sponsorName || 'Sponsor',
          member2Name: userData?.name || 'Member',
          bondId: bondRef.id,
          status: 'active',
          createdAt: new Date(),
          type: 'sponsor',
        };

        const connectionRef = await db
          .collection('trustConnections')
          .add(connectionData);
        console.log(
          `✅ [UPLOAD-PICTURE] Trust connection created: ${connectionRef.id}`
        );
        console.log(
          `✅ [UPLOAD-PICTURE] Connection: ${sponsorMemberCode} ↔ ${memberCode}`
        );

        // 3. Create or update Trust Unit ONLY with members who have actual Trust Bonds
        console.log('[UPLOAD-PICTURE] Step 3: Creating/updating Trust Unit...');
        try {
          // Find ALL members with the same sponsor
          const allMembersSnapshot = await db
            .collection('users')
            .where('sponsorMemberCode', '==', sponsorMemberCode)
            .where('status', '==', 'registered')
            .get();

          const allMemberCodes = allMembersSnapshot.docs.map(doc => doc.id);
          console.log(
            `[UPLOAD-PICTURE] Found ${allMemberCodes.length} members with sponsor ${sponsorMemberCode}:`,
            allMemberCodes
          );

          if (allMemberCodes.length >= 2) {
            // ✅ FIXED: Only create TU with members who have actual Trust Bonds between them
            const connectedMembers = await findConnectedMembers(allMemberCodes);
            console.log(
              `[UPLOAD-PICTURE] Found ${connectedMembers.length} connected members:`,
              connectedMembers
            );

            if (connectedMembers.length >= 2) {
              const tuResult = await createOrGetSameSponsorTU(
                sponsorMemberCode,
                connectedMembers
              );
              console.log(`✅ [UPLOAD-PICTURE] Trust Unit result:`, tuResult);
            } else {
              console.log(
                `[UPLOAD-PICTURE] Not enough connected members (${connectedMembers.length}) for Trust Unit`
              );
            }
          } else {
            console.log(
              `[UPLOAD-PICTURE] Not enough members (${allMemberCodes.length}) for Trust Unit`
            );
          }
        } catch (tuError: any) {
          console.error('[UPLOAD-PICTURE] Trust Unit creation error:', tuError);
        }

        console.log(
          `\n🎉🎉🎉 [UPLOAD-PICTURE] SPONSOR DIVISIONS COMPLETE 🎉🎉🎉\n`
        );
      } catch (divError: any) {
        console.error(
          '\n❌❌❌ [UPLOAD-PICTURE] ERROR CREATING SPONSOR DIVISIONS ❌❌❌'
        );
        console.error('[UPLOAD-PICTURE] Error details:', divError);
        // Don't fail the entire request if division creation fails
      }
    } else {
      console.log(
        '[UPLOAD-PICTURE] ℹ️ No sponsor or admin sponsor (0000000000), skipping division creation'
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        'Profile picture uploaded successfully and registration completed',
      user: {
        memberCode: memberCode,
        hasProfilePicture: true,
        status: 'registered',
      },
      sponsorDivisionsCreated: sponsorId && sponsorId !== '0000000000',
    });
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}
