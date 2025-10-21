import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * Clear vaults collection including all subcollections (messages)
 */
async function clearVaultsCollection(db: any): Promise<void> {
  console.log('[CLEAR-ALL] Clearing vaults collection with subcollections...');

  const vaultsSnapshot = await db.collection('vaults').get();

  if (vaultsSnapshot.empty) {
    console.log('[CLEAR-ALL] Vaults collection is already empty');
    return;
  }

  // Delete each vault and its messages subcollection
  const deletePromises = vaultsSnapshot.docs.map(async (vaultDoc: any) => {
    const vaultId = vaultDoc.id;

    // Delete all messages in the vault's messages subcollection
    const messagesSnapshot = await db
      .collection('vaults')
      .doc(vaultId)
      .collection('messages')
      .get();

    if (!messagesSnapshot.empty) {
      const messageBatch = db.batch();
      messagesSnapshot.docs.forEach((messageDoc: any) => {
        messageBatch.delete(messageDoc.ref);
      });
      await messageBatch.commit();
      console.log(
        `[CLEAR-ALL] Deleted ${messagesSnapshot.size} messages from vault ${vaultId}`
      );
    }

    // Delete the vault document itself
    await vaultDoc.ref.delete();
    console.log(`[CLEAR-ALL] Deleted vault ${vaultId}`);
  });

  await Promise.all(deletePromises);
  console.log(
    `[CLEAR-ALL] Cleared ${vaultsSnapshot.size} vaults and their messages`
  );
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('[CLEAR-ALL] Starting comprehensive clear operation');
    const db = getDb();

    const collectionsToClean = [
      'users',
      'invites',
      'notFoundRegistry',
      'tempUsers',
      'nfArchive',
      'trustBonds',
      'trustUnits',
      'trustConnections',
      'vaults', // ✅ ADDED: Vault conversations and messages
      'voice_uploads', // ✅ ADDED: Voice recording files
      'voice_biometrics', // ✅ ADDED: Voice print data
      'tempMembers', // ✅ ADDED: Temporary member data
    ];

    let totalDeleted = 0;
    const deletionResults: Record<string, number> = {};

    // Clear each collection
    for (const collectionName of collectionsToClean) {
      try {
        // Special handling for vaults (has subcollections)
        if (collectionName === 'vaults') {
          await clearVaultsCollection(db);
          deletionResults[collectionName] = 1; // Mark as processed
          totalDeleted += 1;
          continue;
        }

        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
          console.log(
            `[CLEAR-ALL] Collection ${collectionName} is already empty`
          );
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
        console.log(
          `[CLEAR-ALL] Deleted ${deletedInCollection} documents from ${collectionName}`
        );
      } catch (collectionError: any) {
        console.error(
          `[CLEAR-ALL] Error clearing ${collectionName}:`,
          collectionError
        );
        deletionResults[collectionName] = -1; // Indicate error
      }
    }

    console.log('[CLEAR-ALL] Operation complete:', deletionResults);

    return NextResponse.json({
      ok: true,
      deletedCount: totalDeleted,
      details: deletionResults,
      message: `Cleared ${totalDeleted} total documents across all collections`,
    });
  } catch (error: any) {
    console.error('[CLEAR-ALL] Fatal error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to clear members', details: error.message },
      { status: 500 }
    );
  }
}
