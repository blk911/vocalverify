/**
 * Migration: Add rootSponsorId and depth fields to users collection
 * 
 * Business Rules:
 * - rootSponsorId: The ultimate sponsor at the top of the chain (immutable once set)
 * - depth: How many levels deep from root (0 = root, 1 = direct invite from root, etc.)
 * 
 * Logic:
 * 1. For users with no sponsor (admin-created) → rootSponsorId = their own memberCode, depth = 0
 * 2. For users with sponsor → traverse up to find root, calculate depth
 */

import { getDb } from '../firebaseAdmin';

interface UserData {
  memberCode?: string;
  sponsorMemberCode?: string;
  sponsorId?: string;
  rootSponsorId?: string;
  depth?: number;
  status?: string;
}

export async function migrateAddRootSponsorFields(dryRun: boolean = true): Promise<{
  success: boolean;
  updated: number;
  skipped: number;
  errors: number;
  results: any[];
}> {
  console.log(`\n🔄 [MIGRATION] Starting rootSponsorId + depth migration (dryRun=${dryRun})\n`);
  
  const db = getDb();
  const results: any[] = [];
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} total users\n`);

    // Build a memberCode → userData map for fast lookups
    const userMap = new Map<string, UserData>();
    usersSnapshot.docs.forEach(doc => {
      userMap.set(doc.id, { memberCode: doc.id, ...doc.data() });
    });

    // Process each user
    for (const doc of usersSnapshot.docs) {
      const memberCode = doc.id;
      const userData = doc.data() as UserData;

      try {
        // Skip if already migrated
        if (userData.rootSponsorId !== undefined && userData.depth !== undefined) {
          console.log(`⏭️  [${memberCode}] Already migrated, skipping`);
          skipped++;
          continue;
        }

        // Calculate rootSponsorId and depth
        const { rootSponsorId, depth } = calculateRootAndDepth(memberCode, userMap);

        const result = {
          memberCode,
          name: (userData as any).name || 'N/A',
          sponsor: userData.sponsorMemberCode || 'none',
          rootSponsorId,
          depth,
          action: dryRun ? 'would-update' : 'updated'
        };

        console.log(`✅ [${memberCode}] ${(userData as any).name || 'N/A'}`);
        console.log(`   Sponsor: ${userData.sponsorMemberCode || 'none'}`);
        console.log(`   Root: ${rootSponsorId}, Depth: ${depth}`);
        console.log('');

        if (!dryRun) {
          await doc.ref.update({
            rootSponsorId,
            depth,
            migratedAt: new Date().toISOString()
          });
        }

        results.push(result);
        updated++;

      } catch (error: any) {
        console.error(`❌ [${memberCode}] Error:`, error.message);
        results.push({
          memberCode,
          error: error.message
        });
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    return {
      success: errors === 0,
      updated,
      skipped,
      errors,
      results
    };

  } catch (error: any) {
    console.error('❌ [MIGRATION] Fatal error:', error);
    return {
      success: false,
      updated,
      skipped,
      errors: errors + 1,
      results
    };
  }
}

/**
 * Calculate rootSponsorId and depth for a user
 * 
 * Algorithm:
 * 1. If user has no sponsor → they ARE the root (depth = 0)
 * 2. If user has sponsor → traverse up the chain until we hit root
 * 3. Count hops to determine depth
 */
function calculateRootAndDepth(
  memberCode: string,
  userMap: Map<string, UserData>
): { rootSponsorId: string; depth: number } {
  const visited = new Set<string>();
  let current = memberCode;
  let depth = 0;

  // Traverse up the sponsor chain
  while (true) {
    // Circular reference protection
    if (visited.has(current)) {
      console.warn(`⚠️  [${memberCode}] Circular reference detected at ${current}, treating as root`);
      return { rootSponsorId: current, depth };
    }
    visited.add(current);

    const userData = userMap.get(current);
    if (!userData) {
      console.warn(`⚠️  [${memberCode}] User ${current} not found in map, treating as root`);
      return { rootSponsorId: current, depth };
    }

    const sponsor = userData.sponsorMemberCode || userData.sponsorId;

    // No sponsor = this is the root
    if (!sponsor || sponsor === '0000000000') {
      return { rootSponsorId: current, depth };
    }

    // Move up one level
    current = sponsor;
    depth++;

    // Safety: max depth of 100
    if (depth > 100) {
      console.warn(`⚠️  [${memberCode}] Max depth exceeded, stopping at ${current}`);
      return { rootSponsorId: current, depth: 100 };
    }
  }
}






