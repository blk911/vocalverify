import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { normalizeName } from '@/utils/nameUtils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, message } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Normalize name using site-wide utility (proper case + lowercase)
    const { name: properName, nameLower } = normalizeName(name);

    console.log('[ADMIN-SEND-INVITATION] Name normalization:', {
      input: name,
      properName,
      nameLower,
    });

    // Create admin invitation
    const inviteData = {
      name: properName,
      nameLower: nameLower,
      phone: phone.trim(),
      message: message || "Hello! You've been invited to join our network.",
      sponsorId: '0000000000',
      sponsorName: 'Admin',
      status: 'pending',
      createdAt: new Date().toISOString(),
      inviteId: `admin_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Add ONLY to invites collection (proper architecture)
    const inviteRef = db.collection('invites').doc();
    await inviteRef.set(inviteData);

    console.log('[ADMIN-SEND-INVITATION] Created invite:', inviteRef.id);

    // ⚡ CRITICAL: Check if this name exists in notFoundRegistry
    const nfSnapshot = await db
      .collection('notFoundRegistry')
      .where('nameLower', '==', nameLower)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!nfSnapshot.empty) {
      const nfDoc = nfSnapshot.docs[0];
      console.log(
        '[ADMIN-SEND-INVITATION] ⚡ MATCH FOUND in notFoundRegistry:',
        nfDoc.id
      );

      // Update notFoundRegistry entry - mark as invited
      await db.collection('notFoundRegistry').doc(nfDoc.id).update({
        status: 'invited',
        invitedAt: new Date().toISOString(),
        inviteId: inviteRef.id,
        invitedBy: 'admin',
      });

      console.log(
        '[ADMIN-SEND-INVITATION] ✅ Updated notFoundRegistry status to "invited"'
      );
    } else {
      console.log('[ADMIN-SEND-INVITATION] No matching notFoundRegistry entry');
    }

    return NextResponse.json({
      ok: true,
      message: 'Invitation sent successfully',
      invite: {
        id: inviteRef.id,
        ...inviteData,
      },
    });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
