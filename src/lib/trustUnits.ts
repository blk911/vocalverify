/**
 * Trust Units Core Library - Clean Design
 * 
 * Core Principles:
 * 1. Trust Bonds (TB) = Pairwise connections
 * 2. Trust Units (TU) = Group closures of TB members under same root
 * 3. Root = Lineage metadata ONLY (not a TU member)
 * 4. Same-sponsor and triangle-close TUs are SEPARATE
 */

import { getDb } from './firebaseAdmin';
import { logTUCreation, logTUUpdate, logTriangleCloseDetected } from './telemetry';

interface UserData {
  memberCode?: string;
  rootSponsorId?: string;
  sponsorId?: string;
  sponsorMemberCode?: string;
  depth?: number;
  name?: string;
  fullName?: string;
  profilePicture?: string;
  trustUnits?: string[];
  [key: string]: any;
}

interface TUMember {
  memberCode: string;
  name: string;
  status: 'connected' | 'pending_connection' | 'waiting';
  profilePicture?: string | null;
}

type TUType = 'same_sponsor' | 'triangle_close';

/**
 * Generate unique TU key for idempotent creation
 * 
 * Format: `${rootId}|${type}|${sorted member codes}`
 * 
 * Examples:
 * - same_sponsor: "spencer|same_sponsor|1111111111|2222222222"
 * - triangle_close: "spencer|triangle_close|1111111111|1112222222"
 */
function generateTUKey(rootSponsorId: string, type: TUType, memberCodes: string[]): string {
  const sortedMembers = [...memberCodes].sort().join('|');
  return `${rootSponsorId}|${type}|${sortedMembers}`;
}

/**
 * Ensure user has a rootSponsorId (immutable once set)
 */
export async function ensureRoot(memberCode: string): Promise<{ rootSponsorId: string; depth: number }> {
  const db = getDb();
  const userRef = db.collection('users').doc(memberCode);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    throw new Error(`User ${memberCode} not found`);
  }
  
  const userData = userDoc.data() as UserData;
  
  // ✅ Already has root? Return it (immutable!)
  if (userData.rootSponsorId !== undefined && userData.depth !== undefined) {
    return { rootSponsorId: userData.rootSponsorId, depth: userData.depth };
  }
  
  // Calculate root and depth
  const sponsor = userData.sponsorMemberCode || userData.sponsorId;
  
  let rootSponsorId: string;
  let depth: number;
  
  if (!sponsor || sponsor === '0000000000') {
    // No sponsor → user IS the root
    rootSponsorId = memberCode;
    depth = 0;
  } else {
    // Has sponsor → get sponsor's root
    const sponsorDoc = await db.collection('users').doc(sponsor).get();
    if (!sponsorDoc.exists) {
      // Sponsor not found, treat user as root
      rootSponsorId = memberCode;
      depth = 0;
    } else {
      const sponsorData = sponsorDoc.data() as UserData;
      
      // Ensure sponsor has root first (recursive, but safe due to immutability)
      if (!sponsorData.rootSponsorId) {
        const sponsorRoot = await ensureRoot(sponsor);
        rootSponsorId = sponsorRoot.rootSponsorId;
        depth = sponsorRoot.depth + 1;
      } else {
        rootSponsorId = sponsorData.rootSponsorId;
        depth = (sponsorData.depth || 0) + 1;
      }
    }
  }
  
  // ✅ Set root and depth (IMMUTABLE)
  await userRef.update({
    rootSponsorId,
    depth,
    updatedAt: new Date().toISOString()
  });
  
  return { rootSponsorId, depth };
}

/**
 * Create or get a Same-Sponsor Trust Unit
 * 
 * Rules:
 * - All members share the SAME direct sponsor
 * - Sponsor is NOT in members array (shown in UI as context)
 * - Key: `${rootId}|same_sponsor|${sorted members}`
 */
export async function createOrGetSameSponsorTU(
  sponsorCode: string,
  memberCodes: string[]
): Promise<{ unitId: string; action: 'created' | 'updated' | 'none' }> {
  console.log(`[TU] same-sponsor: sponsor=${sponsorCode}, members=[${memberCodes.join(', ')}]`);
  
  // ✅ DEDUPLICATE member codes to prevent duplicate keys
  const uniqueMemberCodes = [...new Set(memberCodes)];
  if (uniqueMemberCodes.length !== memberCodes.length) {
    console.log(`[TU] Deduplicated member codes: ${memberCodes.length} -> ${uniqueMemberCodes.length}`, {
      original: memberCodes,
      deduplicated: uniqueMemberCodes
    });
  }
  
  if (uniqueMemberCodes.length < 2) {
    console.log(`[TU] same-sponsor: need 2+ members, got ${uniqueMemberCodes.length}`);
    return { unitId: '', action: 'none' };
  }
  
  const db = getDb();
  
  // Get sponsor data for root
  const sponsorDoc = await db.collection('users').doc(sponsorCode).get();
  if (!sponsorDoc.exists) {
    throw new Error(`Sponsor ${sponsorCode} not found`);
  }
  const sponsorData = sponsorDoc.data() as UserData;
  const rootSponsorId = sponsorData.rootSponsorId || sponsorCode;
  
  // Generate unique key with deduplicated member codes
  const tuKey = generateTUKey(rootSponsorId, 'same_sponsor', uniqueMemberCodes);
  
  // Check if TU already exists
  const existingTU = await db.collection('trustUnits')
    .where('tuKey', '==', tuKey)
    .limit(1)
    .get();
  
  if (!existingTU.empty) {
    console.log(`[TU] same-sponsor: found existing TU ${existingTU.docs[0].id}`);
    return { unitId: existingTU.docs[0].id, action: 'none' };
  }
  
  // Fetch member data
  const memberDocs = await Promise.all(
    uniqueMemberCodes.map(code => db.collection('users').doc(code).get())
  );
  
  const members: TUMember[] = memberDocs
    .filter(doc => doc.exists)
    .map(doc => {
      const data = doc.data() as UserData;
      return {
        memberCode: doc.id,
        name: data.name || data.fullName || 'Member',
        status: 'pending_connection' as const,
        profilePicture: data.profilePicture || null
      };
    });
  
  // Generate TU name based on sponsor and member count
  const tuName = `${sponsorData.name || sponsorData.fullName || 'Sponsor'}'s Unit ${uniqueMemberCodes.length}`;

  // ✅ FIXED: Include sponsor in members array for complete Trust Unit
  const sponsorMember: TUMember = {
    memberCode: sponsorCode,
    name: sponsorData.name || sponsorData.fullName || 'Sponsor',
    status: 'pending_connection' as const,
    profilePicture: sponsorData.profilePicture || null
  };
  
  // Add sponsor to members array
  const allMembers = [...members, sponsorMember];
  const allMemberCodes = [...uniqueMemberCodes, sponsorCode];
  
  const tuData = {
    tuKey,
    rootSponsorId,
    tuType: 'same_sponsor',
    tuName, // ✅ NEW: TU name field
    members: allMembers, // ✅ FIXED: Include sponsor in members
    memberCodes: allMemberCodes, // ✅ FIXED: Include sponsor in member codes
    sponsorCode, // Reference for UI context
    sponsorName: sponsorData.name || sponsorData.fullName || 'Sponsor',
    status: 'pending_connections',
    createdAt: new Date(),
    updatedAt: new Date(),
    size: allMembers.length // ✅ FIXED: Correct size including sponsor
  };
  
  const tuRef = await db.collection('trustUnits').add(tuData);
  console.log(`[TU] same-sponsor: created ${tuRef.id}, key=${tuKey}`);
  
  // Update user trustUnits arrays for ALL members including sponsor
  await Promise.all(allMemberCodes.map(code => updateUserTrustUnits(code, tuRef.id)));
  
  // Log telemetry
  logTUCreation(tuRef.id, 'same_sponsor', rootSponsorId, allMembers.length, allMemberCodes);
  
  return { unitId: tuRef.id, action: 'created' };
}

/**
 * Create or get a Triangle-Close Trust Unit
 * 
 * Rules:
 * - Two members share same root BUT different direct sponsors
 * - Forms a cross-connection (triangle)
 * - Key: `${rootId}|triangle_close|${sorted pair}`
 * - Root is NOT in members (shown in UI as context)
 */
export async function createOrGetTriangleCloseTU(
  memberA: string,
  memberB: string
): Promise<{ unitId: string; action: 'created' | 'updated' | 'none'; reason: string }> {
  const db = getDb();
  
  try {
    // Fetch both users
    const [docA, docB] = await Promise.all([
      db.collection('users').doc(memberA).get(),
      db.collection('users').doc(memberB).get()
    ]);
    
    if (!docA.exists || !docB.exists) {
      return { unitId: '', action: 'none', reason: 'User not found' };
    }
    
    const dataA = docA.data() as UserData;
    const dataB = docB.data() as UserData;
    
    // Ensure both have roots
    const rootA = dataA.rootSponsorId || (await ensureRoot(memberA)).rootSponsorId;
    const rootB = dataB.rootSponsorId || (await ensureRoot(memberB)).rootSponsorId;
    
    // Must share same root
    if (rootA !== rootB) {
      return { unitId: '', action: 'none', reason: 'Different roots' };
    }
    
    // Both must be downstream (depth >= 1) - roots don't go in TUs
    const depthA = dataA.depth ?? 0;
    const depthB = dataB.depth ?? 0;
    
    if (depthA === 0 || depthB === 0) {
      return { unitId: '', action: 'none', reason: 'Root members not allowed in TUs' };
    }
    
    console.log(`[TU] triangle-close candidate: A=${memberA} B=${memberB} root=${rootA}`);
    
    // Generate unique key for this pair
    const tuKey = generateTUKey(rootA, 'triangle_close', [memberA, memberB]);
    
    // Check if TU already exists
    const existingTU = await db.collection('trustUnits')
      .where('tuKey', '==', tuKey)
      .limit(1)
      .get();
    
    if (!existingTU.empty) {
      console.log(`[TU] triangle-close: found existing TU ${existingTU.docs[0].id}`);
      return { unitId: existingTU.docs[0].id, action: 'none', reason: 'Already exists' };
    }
    
    // ✅ FIXED: Include root sponsor in triangle-close TU for complete display
    const rootMember: TUMember = {
      memberCode: rootA,
      name: rootData?.name || rootData?.fullName || 'Root Sponsor',
      status: 'pending_connection',
      profilePicture: rootData?.profilePicture || null
    };
    
    const members: TUMember[] = [
      {
        memberCode: memberA,
        name: dataA.name || dataA.fullName || 'Member',
        status: 'pending_connection',
        profilePicture: dataA.profilePicture || null
      },
      {
        memberCode: memberB,
        name: dataB.name || dataB.fullName || 'Member',
        status: 'pending_connection',
        profilePicture: dataB.profilePicture || null
      },
      rootMember // ✅ FIXED: Include root sponsor
    ];
    
    // Get root sponsor data for context
    const rootDoc = await db.collection('users').doc(rootA).get();
    const rootData = rootDoc.exists ? rootDoc.data() as UserData : null;
    
    // Generate TU name for triangle-close
    const tuName = `${rootData?.name || rootData?.fullName || 'Root'}'s Triangle`;
    
    const tuData = {
      tuKey,
      rootSponsorId: rootA,
      tuType: 'triangle_close',
      tuName, // ✅ NEW: TU name field
      members,
      memberCodes: [memberA, memberB, rootA], // ✅ FIXED: Include root sponsor
      sponsorCode: rootA, // For UI context only
      sponsorName: rootData?.name || rootData?.fullName || 'Root Sponsor',
      status: 'pending_connections',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 3 // ✅ FIXED: Correct size including root sponsor
    };
    
    const tuRef = await db.collection('trustUnits').add(tuData);
    console.log(`[TU] triangle-close: created ${tuRef.id}, key=${tuKey}`);
    
    // Update user trustUnits arrays for ALL members including root sponsor
    await Promise.all([
      updateUserTrustUnits(memberA, tuRef.id),
      updateUserTrustUnits(memberB, tuRef.id),
      updateUserTrustUnits(rootA, tuRef.id) // ✅ FIXED: Include root sponsor
    ]);
    
    // Log telemetry
    logTUCreation(tuRef.id, 'triangle_close', rootA, 3, [memberA, memberB, rootA]);
    logTriangleCloseDetected(memberA, memberB, rootA, 'tu_created');
    
    return { unitId: tuRef.id, action: 'created', reason: 'Triangle close detected' };
    
  } catch (error: any) {
    console.error(`[TU] triangle-close error: ${error.message}`);
    return { unitId: '', action: 'none', reason: `Error: ${error.message}` };
  }
}

/**
 * Update user's trustUnits array (idempotent)
 */
async function updateUserTrustUnits(memberCode: string, unitId: string): Promise<void> {
  const db = getDb();
  const userRef = db.collection('users').doc(memberCode);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    return;
  }
  
  const userData = userDoc.data() as UserData;
  const currentTUs = userData.trustUnits || [];
  
  // Idempotent: only add if not present
  if (!currentTUs.includes(unitId)) {
    await userRef.update({
      trustUnits: [...currentTUs, unitId],
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Recompute TU status based on member statuses
 */
export async function recomputeTUStatus(unitId: string): Promise<void> {
  const db = getDb();
  const tuRef = db.collection('trustUnits').doc(unitId);
  const tuDoc = await tuRef.get();
  
  if (!tuDoc.exists) {
    return;
  }
  
  const tuData = tuDoc.data();
  const members = tuData?.members || [];
  
  const allConnected = members.every((m: any) => m.status === 'connected');
  const newStatus = allConnected ? 'fully_connected' : 'pending_connections';
  
  if (tuData?.status !== newStatus) {
    await tuRef.update({
      status: newStatus,
      updatedAt: new Date()
    });
    console.log(`[TU] status=${newStatus}`);
    logTUUpdate(unitId, 'status_changed', 'system', newStatus);
  }
}

/**
 * Create a Trust Unit prospect when cross-connection is detected
 * This is called when a member invites another member with the same sponsor
 */
export async function createTUProspect(
  inviterCode: string,
  inviteeCode: string
): Promise<{ success: boolean; unitId?: string; status?: string; members?: string[]; error?: string }> {
  const db = getDb();
  
  try {
    console.log(`[TU-PROSPECT] Creating prospect: ${inviterCode} ↔ ${inviteeCode}`);
    
    // Fetch both users
    const [inviterDoc, inviteeDoc] = await Promise.all([
      db.collection('users').doc(inviterCode).get(),
      db.collection('users').doc(inviteeCode).get()
    ]);
    
    if (!inviterDoc.exists || !inviteeDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const inviterData = inviterDoc.data() as UserData;
    const inviteeData = inviteeDoc.data() as UserData;
    
    // Ensure both have roots
    const inviterRoot = inviterData.rootSponsorId || (await ensureRoot(inviterCode)).rootSponsorId;
    const inviteeRoot = inviteeData.rootSponsorId || (await ensureRoot(inviteeCode)).rootSponsorId;
    
    // Must share same root
    if (inviterRoot !== inviteeRoot) {
      return { success: false, error: 'Different roots' };
    }
    
    // Generate unique key for this prospect
    const tuKey = generateTUKey(inviterRoot, 'same_sponsor', [inviterCode, inviteeCode]);
    
    // Check if prospect already exists
    const existingProspect = await db.collection('trustUnits')
      .where('tuKey', '==', tuKey)
      .limit(1)
      .get();
    
    if (!existingProspect.empty) {
      const existing = existingProspect.docs[0];
      console.log(`[TU-PROSPECT] Found existing prospect: ${existing.id}`);
      return { 
        success: true, 
        unitId: existing.id, 
        status: existing.data().status,
        members: existing.data().memberCodes || []
      };
    }
    
    // Get sponsor data
    const sponsorCode = inviterData.sponsorId || '0000000000';
    const sponsorDoc = await db.collection('users').doc(sponsorCode).get();
    const sponsorData = sponsorDoc.exists ? sponsorDoc.data() as UserData : null;
    
    // Create prospect with all three members (inviter, invitee, sponsor)
    const members: TUMember[] = [
      {
        memberCode: inviterCode,
        name: inviterData.name || inviterData.fullName || 'Member',
        status: 'pending_connection',
        profilePicture: inviterData.profilePicture || null
      },
      {
        memberCode: inviteeCode,
        name: inviteeData.name || inviteeData.fullName || 'Member',
        status: 'pending_connection',
        profilePicture: inviteeData.profilePicture || null
      },
      {
        memberCode: sponsorCode,
        name: sponsorData?.name || sponsorData?.fullName || 'Sponsor',
        status: 'pending_connection',
        profilePicture: sponsorData?.profilePicture || null
      }
    ];
    
    // Generate TU name for prospect
    const tuName = `${sponsorData?.name || sponsorData?.fullName || 'Sponsor'}'s Prospect`;

    const prospectData = {
      tuKey,
      rootSponsorId: inviterRoot,
      tuType: 'same_sponsor',
      tuName, // ✅ NEW: TU name field
      members,
      memberCodes: [inviterCode, inviteeCode, sponsorCode],
      sponsorCode: inviterData.sponsorId || '0000000000',
      sponsorName: inviterData.sponsorName || 'Sponsor',
      status: 'prospect', // ✅ NEW: prospect status
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 3
    };
    
    const tuRef = await db.collection('trustUnits').add(prospectData);
    console.log(`[TU-PROSPECT] Created prospect: ${tuRef.id}`);
    
    // Update user trustUnits arrays for all three members
    await Promise.all([
      updateUserTrustUnits(inviterCode, tuRef.id),
      updateUserTrustUnits(inviteeCode, tuRef.id),
      updateUserTrustUnits(sponsorCode, tuRef.id)
    ]);
    
    // Log telemetry
    logTUCreation(tuRef.id, 'same_sponsor', inviterRoot, 3, [inviterCode, inviteeCode, sponsorCode]);
    
    return { 
      success: true, 
      unitId: tuRef.id, 
      status: 'prospect',
      members: [inviterCode, inviteeCode, sponsorCode]
    };
    
  } catch (error: any) {
    console.error(`[TU-PROSPECT] Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
