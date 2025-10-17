/**
 * CLEANUP SCRIPT: Remove Invalid Trust Units
 * 
 * This script removes Trust Units created by the old broken logic:
 * - TUs where the sponsor is in the members array (WRONG)
 * - TUs with only 1 member (should have 2+ invitees)
 * 
 * Run once to clean up corrupt data.
 */

import { getDb } from '@/lib/firebaseAdmin';

export async function cleanupInvalidTrustUnits() {
  const db = getDb();
  const trustUnitsRef = db.collection('trustUnits');
  
  console.log('\n🔥 STARTING TRUST UNIT CLEANUP 🔥\n');
  
  try {
    // Get ALL trust units
    const snapshot = await trustUnitsRef.get();
    console.log(`Found ${snapshot.size} total trust units`);
    
    const invalidUnits: any[] = [];
    const validUnits: any[] = [];
    
    snapshot.forEach((doc) => {
      const unit = doc.data();
      const unitId = doc.id;
      
      // Check for invalid conditions
      const sponsorInMembers = unit.members?.includes(unit.sponsorCode);
      const tooSmall = (unit.members?.length || 0) < 2;
      
      if (sponsorInMembers || tooSmall) {
        invalidUnits.push({
          id: unitId,
          sponsorCode: unit.sponsorCode,
          members: unit.members,
          size: unit.size,
          reason: sponsorInMembers ? 'SPONSOR_IN_MEMBERS' : 'TOO_SMALL'
        });
      } else {
        validUnits.push({
          id: unitId,
          sponsorCode: unit.sponsorCode,
          members: unit.members,
          size: unit.size
        });
      }
    });
    
    console.log(`\n✅ Valid Trust Units: ${validUnits.length}`);
    console.log(`❌ Invalid Trust Units: ${invalidUnits.length}\n`);
    
    if (invalidUnits.length > 0) {
      console.log('🗑️  INVALID UNITS TO DELETE:');
      invalidUnits.forEach((unit) => {
        console.log(`  - ${unit.id}`);
        console.log(`    Sponsor: ${unit.sponsorCode}`);
        console.log(`    Members: ${unit.members?.join(', ')}`);
        console.log(`    Size: ${unit.size}`);
        console.log(`    Reason: ${unit.reason}`);
        console.log('');
      });
      
      // DELETE invalid units
      const batch = db.batch();
      invalidUnits.forEach((unit) => {
        batch.delete(trustUnitsRef.doc(unit.id));
      });
      
      await batch.commit();
      console.log(`\n✅ DELETED ${invalidUnits.length} invalid Trust Units\n`);
    } else {
      console.log('✅ No invalid Trust Units found. Database is clean!\n');
    }
    
    if (validUnits.length > 0) {
      console.log('✅ VALID TRUST UNITS (kept):');
      validUnits.forEach((unit) => {
        console.log(`  - ${unit.id}`);
        console.log(`    Sponsor: ${unit.sponsorCode}`);
        console.log(`    Members: ${unit.members?.join(', ')} (${unit.size} total)`);
        console.log('');
      });
    }
    
    return {
      deleted: invalidUnits.length,
      kept: validUnits.length,
      invalidUnits,
      validUnits
    };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Export for API route
export default cleanupInvalidTrustUnits;











