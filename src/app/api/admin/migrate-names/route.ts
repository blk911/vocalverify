import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { normalizeName } from "@/utils/nameUtils";

export const runtime = "nodejs";

/**
 * POST /api/admin/migrate-names
 * One-time migration to add nameLower field to all existing records
 * This ensures case-insensitive search works for ALL data
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[MIGRATE-NAMES] Starting migration...');
    
    const db = getDb();
    const collections = ['users', 'invites', 'notFoundRegistry'];
    const results: Record<string, any> = {};
    
    for (const collectionName of collections) {
      console.log(`[MIGRATE-NAMES] Processing ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`[MIGRATE-NAMES] ${collectionName} is empty, skipping`);
        results[collectionName] = { total: 0, updated: 0, skipped: 0 };
        continue;
      }
      
      let updated = 0;
      let skipped = 0;
      const batch = db.batch();
      let batchCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Skip if already has nameLower
        if (data.nameLower) {
          skipped++;
          continue;
        }
        
        // Skip if no name field
        if (!data.name) {
          skipped++;
          continue;
        }
        
        // Add nameLower field
        const { nameLower } = normalizeName(data.name);
        batch.update(doc.ref, { nameLower });
        updated++;
        batchCount++;
        
        console.log(`[MIGRATE-NAMES] ${collectionName}/${doc.id}: "${data.name}" -> nameLower: "${nameLower}"`);
        
        // Firestore batch limit is 500
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`[MIGRATE-NAMES] Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
      
      // Commit remaining updates
      if (batchCount > 0) {
        await batch.commit();
        console.log(`[MIGRATE-NAMES] Committed final batch of ${batchCount} updates`);
      }
      
      results[collectionName] = {
        total: snapshot.size,
        updated,
        skipped
      };
      
      console.log(`[MIGRATE-NAMES] ${collectionName} complete: ${updated} updated, ${skipped} skipped`);
    }
    
    console.log('[MIGRATE-NAMES] Migration complete!', results);
    
    return NextResponse.json({
      ok: true,
      message: "Migration completed successfully",
      results
    });
    
  } catch (error: any) {
    console.error('[MIGRATE-NAMES] Error:', error);
    return NextResponse.json(
      { ok: false, error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}





