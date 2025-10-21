import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/delete-invite
 * Comprehensive delete of invite and all related artifacts
 * Removes: invite record, user data (if exists), temp data, not found registry
 */
export async function DELETE(req: NextRequest) {
  try {
    const { inviteId, memberCode, phone } = await req.json();

    console.log('[DELETE-INVITE] Request received:', {
      inviteId,
      memberCode,
      phone,
    });

    if (!inviteId) {
      return NextResponse.json(
        { ok: false, error: 'Invite ID is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const batch = db.batch();
    const deletedItems: string[] = [];

    // 1. Delete from invites collection (primary)
    const inviteRef = db.collection('invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (inviteDoc.exists) {
      batch.delete(inviteRef);
      deletedItems.push('invite');
      console.log('[DELETE-INVITE] Queued invite for deletion:', inviteId);
    } else {
      console.log(
        '[DELETE-INVITE] Invite not found in invites collection:',
        inviteId
      );
    }

    // 2. Delete from notFoundRegistry (if exists)
    const nfRef = db.collection('notFoundRegistry').doc(inviteId);
    const nfDoc = await nfRef.get();

    if (nfDoc.exists) {
      batch.delete(nfRef);
      deletedItems.push('notFoundRegistry');
      console.log('[DELETE-INVITE] Queued notFoundRegistry entry for deletion');
    }

    // 3. Delete user data if memberCode or phone provided
    if (memberCode) {
      const userRef = db.collection('users').doc(memberCode);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        batch.delete(userRef);
        deletedItems.push('user');
        console.log('[DELETE-INVITE] Queued user for deletion:', memberCode);
      }
    }

    // 4. If phone provided, search and delete by phone
    if (phone) {
      // Search users by phone
      const usersByPhone = await db
        .collection('users')
        .where('phone', '==', phone)
        .limit(5)
        .get();

      usersByPhone.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedItems.push(`user-by-phone:${doc.id}`);
        console.log(
          '[DELETE-INVITE] Queued user by phone for deletion:',
          doc.id
        );
      });

      // Search temp users by phone
      const tempUsersByPhone = await db
        .collection('tempUsers')
        .where('phone', '==', phone)
        .limit(5)
        .get();

      tempUsersByPhone.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedItems.push(`tempUser:${doc.id}`);
        console.log('[DELETE-INVITE] Queued temp user for deletion:', doc.id);
      });
    }

    // 5. Delete any pending invites with matching phone
    if (phone) {
      const invitesByPhone = await db
        .collection('invites')
        .where('phone', '==', phone)
        .limit(10)
        .get();

      invitesByPhone.docs.forEach(doc => {
        if (doc.id !== inviteId) {
          // Don't double-delete
          batch.delete(doc.ref);
          deletedItems.push(`invite-by-phone:${doc.id}`);
          console.log(
            '[DELETE-INVITE] Queued related invite for deletion:',
            doc.id
          );
        }
      });
    }

    // Commit all deletions
    await batch.commit();
    console.log(
      '[DELETE-INVITE] Batch committed successfully. Deleted:',
      deletedItems
    );

    return NextResponse.json({
      ok: true,
      message: 'Invite and all related artifacts deleted successfully',
      deletedItems: deletedItems,
      count: deletedItems.length,
    });
  } catch (error: any) {
    console.error('[DELETE-INVITE] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to delete invite' },
      { status: 500 }
    );
  }
}
