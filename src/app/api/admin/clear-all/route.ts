import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    console.log('[CLEAR-ALL] Starting comprehensive clear operation');
    const db = getDb();
    
    const collectionsToClean = [
      'users',
      'invites',
      'notFoundRegistry',
      'tempUsers',
      'nfArchive'
    ];
    
    let totalDeleted = 0;
    const deletionResults: Record<string, number> = {};
    
    // Clear each collection
    for (const collectionName of collectionsToClean) {
      try {
        const snapshot = await db.collection(collectionName).get();
        
        if (snapshot.empty) {
          console.log(`[CLEAR-ALL] Collection ${collectionName} is already empty`);
          deletionResults[collectionName] = 0;
          continue;
        }
        
        // Use batch for atomic deletion (max 500 per batch)
        const batches = [];
        let batch = db.batch();
        let operationCount = 0;
        let deletedInCollection = 0;
        
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          operationCount++;
          deletedInCollection++;
          
          // Firestore batch limit is 500 operations
          if (operationCount === 500) {
            batches.push(batch.commit());
            batch = db.batch();
            operationCount = 0;
          }
        });
        
        // Commit remaining operations
        if (operationCount > 0) {
          batches.push(batch.commit());
        }
        
        // Wait for all batches to complete
        await Promise.all(batches);
        
        deletionResults[collectionName] = deletedInCollection;
        totalDeleted += deletedInCollection;
        console.log(`[CLEAR-ALL] Deleted ${deletedInCollection} documents from ${collectionName}`);
        
      } catch (collectionError: any) {
        console.error(`[CLEAR-ALL] Error clearing ${collectionName}:`, collectionError);
        deletionResults[collectionName] = -1; // Indicate error
      }
    }
    
    console.log('[CLEAR-ALL] Operation complete:', deletionResults);
    
    return NextResponse.json({
      ok: true,
      deletedCount: totalDeleted,
      details: deletionResults,
      message: `Cleared ${totalDeleted} total documents across all collections`
    });

  } catch (error: any) {
    console.error('[CLEAR-ALL] Fatal error:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to clear members", details: error.message },
      { status: 500 }
    );
  }
}
