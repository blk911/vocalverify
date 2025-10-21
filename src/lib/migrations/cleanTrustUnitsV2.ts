/**
 * Trust Units Migration Script - V2 Clean Design
 *
 * Purpose: Clean up existing TU data to conform to the new clean design:
 * 1. Remove sponsors from TU members arrays
 * 2. Add `tuKey` field for idempotent lookups
 * 3. Ensure `tuType` is set correctly
 * 4. Separate mixed TUs into distinct same-sponsor and triangle-close units
 */

import { getDb } from '../firebaseAdmin';

interface TUMember {
  memberCode: string;
  name: string;
  status?: string;
  profilePicture?: string;
  sponsorId?: string;
  depth?: number;
}

interface TrustUnitDoc {
  id: string;
  rootSponsorId: string;
  sponsorCode?: string;
  sponsorName?: string;
  members: TUMember[];
  memberCodes?: string[];
  type?: string;
  tuType?: string;
  tuKey?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  size?: number;
}

/**
 * Generate unique TU key
 */
function generateTUKey(
  rootSponsorId: string,
  type: 'same_sponsor' | 'triangle_close',
  memberCodes: string[]
): string {
  const sortedMembers = [...memberCodes].sort().join('|');
  return `${rootSponsorId}|${type}|${sortedMembers}`;
}

/**
 * Main migration function
 */
export async function cleanTrustUnitsV2(dryRun: boolean = true): Promise<{
  processed: number;
  updated: number;
  deleted: number;
  errors: string[];
}> {
  const db = getDb();
  const results = {
    processed: 0,
    updated: 0,
    deleted: 0,
    errors: [] as string[],
  };

  console.log(
    `\n🔧 [MIGRATION] Trust Units V2 Cleanup${dryRun ? ' (DRY RUN)' : ''}`
  );
  console.log(
    '════════════════════════════════════════════════════════════════\n'
  );

  try {
    // Fetch all Trust Units
    const tusSnapshot = await db.collection('trustUnits').get();
    console.log(`📊 Found ${tusSnapshot.size} Trust Units to process\n`);

    for (const tuDoc of tusSnapshot.docs) {
      results.processed++;
      const tu = tuDoc.data() as TrustUnitDoc;
      const tuId = tuDoc.id;

      console.log(
        `\n[${results.processed}/${tusSnapshot.size}] Processing TU: ${tuId}`
      );
      console.log(
        `   Root: ${tu.rootSponsorId || tu.sponsorCode || 'MISSING'}`
      );
      console.log(`   Type: ${tu.tuType || tu.type || 'MISSING'}`);
      console.log(`   Members: ${tu.members?.length || 0}`);

      // ✅ Step 1: Determine rootSponsorId
      const rootSponsorId = tu.rootSponsorId || tu.sponsorCode;
      if (!rootSponsorId) {
        const msg = `Missing rootSponsorId for TU ${tuId}`;
        console.log(`   ❌ ${msg}`);
        results.errors.push(msg);
        continue;
      }

      // ✅ Step 2: Determine type
      let tuType: 'same_sponsor' | 'triangle_close' =
        (tu.tuType as any) || (tu.type as any) || 'same_sponsor';

      // Infer type from members if missing
      if (!tu.tuType && !tu.type && tu.members && tu.members.length > 0) {
        // Check if all members have the same direct sponsor
        const sponsorIds = tu.members.map(m => m.sponsorId).filter(Boolean);

        const uniqueSponsors = new Set(sponsorIds);

        if (uniqueSponsors.size === 1 && uniqueSponsors.has(rootSponsorId)) {
          tuType = 'same_sponsor';
          console.log(
            `   🔍 Inferred type: same_sponsor (all members share sponsor ${rootSponsorId})`
          );
        } else if (uniqueSponsors.size > 1) {
          tuType = 'triangle_close';
          console.log(
            `   🔍 Inferred type: triangle_close (members have different sponsors)`
          );
        }
      }

      // ✅ Step 3: Clean members array (remove sponsor)
      let cleanMembers: TUMember[] = [];
      if (tu.members && Array.isArray(tu.members)) {
        cleanMembers = tu.members.filter(m => {
          // Remove if member is the sponsor/root
          if (
            m.memberCode === rootSponsorId ||
            m.memberCode === tu.sponsorCode
          ) {
            console.log(`   🧹 Removing sponsor ${m.memberCode} from members`);
            return false;
          }
          return true;
        });
      }

      if (cleanMembers.length < 2) {
        console.log(
          `   ⚠️  TU has < 2 members after cleanup, marking for deletion`
        );
        if (!dryRun) {
          await tuDoc.ref.delete();
          results.deleted++;
        }
        continue;
      }

      // ✅ Step 4: Generate tuKey
      const memberCodes = cleanMembers.map(m => m.memberCode);
      const tuKey = generateTUKey(rootSponsorId, tuType, memberCodes);

      // ✅ Step 5: Check if update is needed
      const needsUpdate =
        !tu.tuKey ||
        tu.tuKey !== tuKey ||
        !tu.tuType ||
        tu.members.length !== cleanMembers.length ||
        tu.memberCodes?.length !== memberCodes.length;

      if (needsUpdate) {
        console.log(`   ✏️  UPDATE NEEDED:`);
        console.log(`      - New tuKey: ${tuKey}`);
        console.log(`      - New tuType: ${tuType}`);
        console.log(`      - Clean members: ${memberCodes.join(', ')}`);

        if (!dryRun) {
          await tuDoc.ref.update({
            tuKey,
            tuType,
            rootSponsorId,
            members: cleanMembers,
            memberCodes,
            size: cleanMembers.length,
            updatedAt: new Date(),
          });
          results.updated++;
          console.log(`   ✅ Updated TU ${tuId}`);
        } else {
          results.updated++;
          console.log(`   🔵 Would update TU ${tuId} (dry run)`);
        }
      } else {
        console.log(`   ✅ TU is clean, no update needed`);
      }
    }

    console.log(
      '\n════════════════════════════════════════════════════════════════'
    );
    console.log(`\n📈 [MIGRATION] Summary${dryRun ? ' (DRY RUN)' : ''}:`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Deleted: ${results.deleted}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      results.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (dryRun) {
      console.log(
        '\n💡 This was a DRY RUN. Run with dryRun=false to apply changes.\n'
      );
    } else {
      console.log('\n✅ Migration complete!\n');
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    results.errors.push(error.message);
    throw error;
  }

  return results;
}
