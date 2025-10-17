import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    
    console.log('[TU-MIGRATION] Starting TU names migration...');

    // Get all Trust Units
    const tusSnapshot = await db.collection('trustUnits').get();
    const tus = tusSnapshot.docs;
    
    console.log(`[TU-MIGRATION] Found ${tus.length} Trust Units to process`);

    let updated = 0;
    let skipped = 0;

    for (const tuDoc of tus) {
      const tuData = tuDoc.data();
      
      // Skip if already has a name
      if (tuData.tuName) {
        skipped++;
        continue;
      }

      // Generate TU name based on type and sponsor
      let tuName = '';
      
      if (tuData.tuType === 'same_sponsor') {
        const memberCount = tuData.memberCodes?.length || 0;
        tuName = `${tuData.sponsorName || 'Sponsor'}'s Unit ${memberCount}`;
      } else if (tuData.tuType === 'triangle_close') {
        tuName = `${tuData.sponsorName || 'Root'}'s Triangle`;
      } else {
        // Fallback for unknown types
        tuName = `Trust Unit ${tuDoc.id.slice(-6)}`;
      }

      // Update the TU with the generated name
      await tuDoc.ref.update({
        tuName,
        updatedAt: new Date()
      });

      console.log(`[TU-MIGRATION] Updated TU ${tuDoc.id}: ${tuName}`);
      updated++;
    }

    console.log(`[TU-MIGRATION] Migration complete: ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: 'TU names migration completed',
      stats: {
        total: tus.length,
        updated,
        skipped
      }
    });

  } catch (error: any) {
    console.error('[TU-MIGRATION] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}







