/**
 * Trust Unit Blocker Utility
 * 
 * Prevents duplicate invites to members already in the same TU
 * 
 * Business Rules:
 * - Block invites to members who share the same rootSponsorId and are already in a TU together
 * - Allow invites across different roots
 * - Provide clear error messages for blocked invites
 */

import { getDb } from './firebaseAdmin';

export interface BlockerResult {
  shouldBlock: boolean;
  reason: string;
  existingTUId?: string;
  rootSponsorId?: string;
}

/**
 * Check if an invite should be blocked due to existing TU membership
 * 
 * @param inviterCode - The member sending the invite
 * @param inviteeName - The name of the person being invited (not yet registered)
 * @param inviteePhone - The phone number of the person being invited
 * @returns BlockerResult with decision and reason
 */
export async function checkInviteBlock(
  inviterCode: string,
  inviteeName: string,
  inviteePhone: string
): Promise<BlockerResult> {
  console.log(`\n🚫 [TU-BLOCKER] Checking invite: ${inviterCode} → ${inviteeName}`);

  const db = getDb();

  try {
    // Get inviter data
    const inviterDoc = await db.collection('users').doc(inviterCode).get();
    if (!inviterDoc.exists) {
      console.log('❌ [TU-BLOCKER] Inviter not found');
      return { shouldBlock: false, reason: 'Inviter not found' };
    }

    const inviterData = inviterDoc.data();
    const inviterRoot = inviterData?.rootSponsorId;

    if (!inviterRoot) {
      console.log('ℹ️  [TU-BLOCKER] Inviter has no root, allowing invite');
      return { shouldBlock: false, reason: 'No root sponsor' };
    }

    // Check if invitee is already registered
    const inviteeDoc = await db.collection('users').doc(inviteePhone).get();
    if (!inviteeDoc.exists) {
      console.log('ℹ️  [TU-BLOCKER] Invitee not yet registered, allowing invite');
      return { shouldBlock: false, reason: 'Invitee not registered' };
    }

    const inviteeData = inviteeDoc.data();
    const inviteeCode = inviteeDoc.id;
    const inviteeRoot = inviteeData?.rootSponsorId;

    // Different roots? Allow
    if (inviteeRoot !== inviterRoot) {
      console.log('ℹ️  [TU-BLOCKER] Different roots, allowing invite');
      return { shouldBlock: false, reason: 'Different root sponsors' };
    }

    // Same root - check if they're already in a TU together
    console.log(`🔍 [TU-BLOCKER] Same root (${inviterRoot}), checking TU membership`);

    const tuQuery = await db.collection('trustUnits')
      .where('rootSponsorId', '==', inviterRoot)
      .get();

    for (const tuDoc of tuQuery.docs) {
      const tuData = tuDoc.data();
      const memberCodes = tuData.memberCodes || [];

      if (memberCodes.includes(inviterCode) && memberCodes.includes(inviteeCode)) {
        console.log(`⚠️  [TU-BLOCKER] Already in TU ${tuDoc.id} together - BLOCKING`);
        return {
          shouldBlock: true,
          reason: `${inviteeName} is already in your Trust Unit`,
          existingTUId: tuDoc.id,
          rootSponsorId: inviterRoot
        };
      }
    }

    console.log('✅ [TU-BLOCKER] Not in same TU, allowing invite');
    return { shouldBlock: false, reason: 'Not in same TU' };

  } catch (error: any) {
    console.error('❌ [TU-BLOCKER] Error:', error);
    // On error, don't block (fail open)
    return { shouldBlock: false, reason: `Error checking: ${error.message}` };
  }
}

/**
 * Check if a member is inviting their own sponsor (circular invite)
 * This is ALLOWED per business rules, but we want to detect it for logging
 */
export async function detectCircularInvite(
  inviterCode: string,
  inviteeCode: string
): Promise<{ isCircular: boolean; reason: string }> {
  console.log(`\n🔄 [CIRCULAR-CHECK] ${inviterCode} → ${inviteeCode}`);

  const db = getDb();

  try {
    const inviterDoc = await db.collection('users').doc(inviterCode).get();
    if (!inviterDoc.exists) {
      return { isCircular: false, reason: 'Inviter not found' };
    }

    const inviterData = inviterDoc.data();
    const inviterSponsor = inviterData?.sponsorMemberCode || inviterData?.sponsorId;

    if (inviterSponsor === inviteeCode) {
      console.log('⚠️  [CIRCULAR-CHECK] Inviting own sponsor - ALLOWED but logged');
      return { isCircular: true, reason: 'Inviting own sponsor' };
    }

    console.log('✅ [CIRCULAR-CHECK] Not circular');
    return { isCircular: false, reason: 'Not circular' };

  } catch (error: any) {
    console.error('❌ [CIRCULAR-CHECK] Error:', error);
    return { isCircular: false, reason: `Error: ${error.message}` };
  }
}











