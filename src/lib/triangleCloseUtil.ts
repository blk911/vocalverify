/**
 * Triangle Close Utility
 *
 * Detects "triangle close" conditions for Trust Unit v1
 *
 * Business Rules:
 * - Two members share the same rootSponsorId
 * - A direct trust bond forms between them
 * - Both are registered (depth 1+)
 * - Creates TU with [inviter, invitee, root sponsor]
 * - Only 1 TU per rootSponsorId per member set
 */

import { getDb } from './firebaseAdmin';
import {
  logTriangleCloseDetected,
  logTUCreation,
  logTUUpdate,
} from './telemetry';

export interface TriangleCloseResult {
  shouldCreateTU: boolean;
  reason: string;
  rootSponsorId?: string;
  members?: string[]; // [inviter, invitee] - sponsor added separately
  existingTUId?: string;
}

/**
 * Check if a triangle close occurs between inviter and invitee
 *
 * @param inviterCode - The member sending the invite
 * @param inviteeCode - The newly registered member accepting the invite
 * @returns TriangleCloseResult with decision and data
 */
export async function detectTriangleClose(
  inviterCode: string,
  inviteeCode: string
): Promise<TriangleCloseResult> {
  console.log(
    `\n🔺 [TRIANGLE-CLOSE] Checking: ${inviterCode} → ${inviteeCode}`
  );

  const db = getDb();

  try {
    // Fetch both users
    const [inviterDoc, inviteeDoc] = await Promise.all([
      db.collection('users').doc(inviterCode).get(),
      db.collection('users').doc(inviteeCode).get(),
    ]);

    if (!inviterDoc.exists || !inviteeDoc.exists) {
      console.log('❌ [TRIANGLE-CLOSE] One or both users not found');
      return { shouldCreateTU: false, reason: 'User not found' };
    }

    const inviterData = inviterDoc.data();
    const inviteeData = inviteeDoc.data();

    const inviterRoot = inviterData?.rootSponsorId;
    const inviteeRoot = inviteeData?.rootSponsorId;
    const inviterDepth = inviterData?.depth;
    const inviteeDepth = inviteeData?.depth;

    console.log(
      `📊 [TRIANGLE-CLOSE] Inviter: root=${inviterRoot}, depth=${inviterDepth}`
    );
    console.log(
      `📊 [TRIANGLE-CLOSE] Invitee: root=${inviteeRoot}, depth=${inviteeDepth}`
    );

    // Rule 1: Must have same root
    if (!inviterRoot || !inviteeRoot || inviterRoot !== inviteeRoot) {
      console.log('❌ [TRIANGLE-CLOSE] Different roots, no triangle');
      return { shouldCreateTU: false, reason: 'Different root sponsors' };
    }

    // Rule 2: Both must be registered (depth >= 1)
    if (inviterDepth === undefined || inviteeDepth === undefined) {
      console.log('❌ [TRIANGLE-CLOSE] Missing depth data');
      return { shouldCreateTU: false, reason: 'Missing depth data' };
    }

    if (inviterDepth < 1 || inviteeDepth < 1) {
      console.log('❌ [TRIANGLE-CLOSE] One or both are root (depth 0)');
      return {
        shouldCreateTU: false,
        reason: 'Cannot form TU with root members',
      };
    }

    // Rule 3: Check if they're already in a TU together with this root
    console.log(
      `🔍 [TRIANGLE-CLOSE] Checking for existing TU with root ${inviterRoot}`
    );

    const existingTUQuery = await db
      .collection('trustUnits')
      .where('rootSponsorId', '==', inviterRoot)
      .get();

    for (const tuDoc of existingTUQuery.docs) {
      const tuData = tuDoc.data();
      const memberCodes = tuData.memberCodes || [];

      // Check if both inviter and invitee are already in this TU
      if (
        memberCodes.includes(inviterCode) &&
        memberCodes.includes(inviteeCode)
      ) {
        console.log(`⚠️  [TRIANGLE-CLOSE] Already in TU ${tuDoc.id} together`);
        return {
          shouldCreateTU: false,
          reason: 'Already in same Trust Unit',
          existingTUId: tuDoc.id,
        };
      }
    }

    // ✅ All conditions met - triangle close detected!
    console.log(`✅ [TRIANGLE-CLOSE] Triangle detected! Root: ${inviterRoot}`);

    // ✅ PHASE 5: Log telemetry
    logTriangleCloseDetected(
      inviterCode,
      inviteeCode,
      inviterRoot,
      'tu_created'
    );

    return {
      shouldCreateTU: true,
      reason: 'Triangle close detected',
      rootSponsorId: inviterRoot,
      members: [inviterCode, inviteeCode],
    };
  } catch (error: any) {
    console.error('❌ [TRIANGLE-CLOSE] Error:', error);
    return { shouldCreateTU: false, reason: `Error: ${error.message}` };
  }
}

/**
 * Create or update Trust Unit with triangle close
 *
 * @param inviterCode - The member sending the invite
 * @param inviteeCode - The newly registered member
 * @param rootSponsorId - The shared root sponsor
 */
export async function createOrUpdateTriangleTU(
  inviterCode: string,
  inviteeCode: string,
  rootSponsorId: string
): Promise<{
  success: boolean;
  unitId: string | null;
  action: 'created' | 'updated' | 'none';
}> {
  console.log(
    `\n🏗️  [TU-CREATE] Creating triangle TU: ${inviterCode} + ${inviteeCode} (root: ${rootSponsorId})`
  );

  const db = getDb();

  try {
    // Check if a TU already exists for this root
    const existingTUQuery = await db
      .collection('trustUnits')
      .where('rootSponsorId', '==', rootSponsorId)
      .limit(1)
      .get();

    if (!existingTUQuery.empty) {
      // TU exists - add new members to it
      const tuDoc = existingTUQuery.docs[0];
      const tuData = tuDoc.data();
      const currentMembers = tuData.members || [];
      const currentMemberCodes = tuData.memberCodes || [];

      // Fetch member data
      const [inviterDoc, inviteeDoc] = await Promise.all([
        db.collection('users').doc(inviterCode).get(),
        db.collection('users').doc(inviteeCode).get(),
      ]);

      const inviterData = inviterDoc.exists ? inviterDoc.data() : null;
      const inviteeData = inviteeDoc.exists ? inviteeDoc.data() : null;

      // Add members who aren't already present
      const membersToAdd = [];

      if (!currentMemberCodes.includes(inviterCode)) {
        membersToAdd.push({
          memberCode: inviterCode,
          name: inviterData?.name || inviterData?.fullName || 'Member',
          status: 'pending_connection',
          profilePicture: inviterData?.profilePicture || null,
        });
      }

      if (!currentMemberCodes.includes(inviteeCode)) {
        membersToAdd.push({
          memberCode: inviteeCode,
          name: inviteeData?.name || inviteeData?.fullName || 'Member',
          status: 'pending_connection',
          profilePicture: inviteeData?.profilePicture || null,
        });
      }

      if (membersToAdd.length > 0) {
        const updatedMembers = [...currentMembers, ...membersToAdd];
        const updatedMemberCodes = updatedMembers.map((m: any) => m.memberCode);

        await tuDoc.ref.update({
          members: updatedMembers,
          memberCodes: updatedMemberCodes,
          size: updatedMembers.length,
          updatedAt: new Date(),
          status: 'pending_connections',
        });

        console.log(
          `✅ [TU-CREATE] Updated TU ${tuDoc.id} with ${membersToAdd.length} new members`
        );

        // ✅ PHASE 5: Log telemetry for each added member
        membersToAdd.forEach(member => {
          logTUUpdate(tuDoc.id, 'member_added', member.memberCode);
        });

        return { success: true, unitId: tuDoc.id, action: 'updated' };
      } else {
        console.log(`ℹ️  [TU-CREATE] Members already in TU ${tuDoc.id}`);
        return { success: true, unitId: tuDoc.id, action: 'none' };
      }
    } else {
      // Create new TU with inviter + invitee (sponsor not included in members array)
      const [inviterDoc, inviteeDoc, rootDoc] = await Promise.all([
        db.collection('users').doc(inviterCode).get(),
        db.collection('users').doc(inviteeCode).get(),
        db.collection('users').doc(rootSponsorId).get(),
      ]);

      const inviterData = inviterDoc.exists ? inviterDoc.data() : null;
      const inviteeData = inviteeDoc.exists ? inviteeDoc.data() : null;
      const rootData = rootDoc.exists ? rootDoc.data() : null;

      const members = [
        {
          memberCode: inviterCode,
          name: inviterData?.name || inviterData?.fullName || 'Member',
          status: 'pending_connection',
          profilePicture: inviterData?.profilePicture || null,
        },
        {
          memberCode: inviteeCode,
          name: inviteeData?.name || inviteeData?.fullName || 'Member',
          status: 'pending_connection',
          profilePicture: inviteeData?.profilePicture || null,
        },
      ];

      const newTUData = {
        members,
        memberCodes: [inviterCode, inviteeCode],
        rootSponsorId,
        sponsorCode: rootSponsorId, // Legacy field for compatibility
        sponsorName: rootData?.name || rootData?.fullName || 'Root Sponsor',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 2,
        status: 'pending_connections',
        type: 'triangle_close', // Mark as triangle close TU
      };

      const tuRef = await db.collection('trustUnits').add(newTUData);
      console.log(`✅ [TU-CREATE] Created new triangle TU ${tuRef.id}`);

      // ✅ PHASE 5: Log telemetry
      logTUCreation(tuRef.id, 'triangle_close', rootSponsorId, 2, [
        inviterCode,
        inviteeCode,
      ]);

      return { success: true, unitId: tuRef.id, action: 'created' };
    }
  } catch (error: any) {
    console.error('❌ [TU-CREATE] Error:', error);
    return { success: false, unitId: null, action: 'none' };
  }
}
