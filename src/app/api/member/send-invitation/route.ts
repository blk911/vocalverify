import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { normalizeName } from '@/utils/nameUtils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { memberCode, inviteeEmail, inviteeName } = await req.json();

    if (!memberCode || !inviteeEmail) {
      return NextResponse.json(
        { ok: false, error: 'Member code and invitee email are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get inviter data
    const inviterDoc = await db.collection('users').doc(memberCode).get();
    if (!inviterDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Inviter not found' },
        { status: 404 }
      );
    }

    const inviterData = inviterDoc.data();

    // Normalize invitee name if provided
    let nameLower = null;
    let properName = inviteeName || null;

    if (inviteeName) {
      const normalized = normalizeName(inviteeName);
      properName = normalized.name;
      nameLower = normalized.nameLower;
    }

    // Create invite
    const inviteData = {
      inviteCode: Math.random().toString(36).substr(2, 10).toUpperCase(),
      inviterUid: memberCode,
      inviterMemberCode: memberCode, // Member code is the inviter's memberCode
      inviterName: inviterData?.name || inviterData?.fullName || 'Unknown',
      inviteeEmail: inviteeEmail.trim(),
      inviteeName: properName,
      nameLower: nameLower,
      status: 'sent',
      sponsorId: memberCode, // Member becomes sponsor
      sponsorName: inviterData?.name || inviterData?.fullName || 'Unknown',
      sponsorMemberCode: memberCode,
      createdAt: new Date().toISOString(),
    };

    const inviteRef = await db.collection('invites').add(inviteData);

    console.log('[MEMBER-SEND-INVITATION] Created invite:', inviteRef.id);

    // ⚡ CRITICAL: Check if this name exists in notFoundRegistry
    if (nameLower) {
      const nfSnapshot = await db
        .collection('notFoundRegistry')
        .where('nameLower', '==', nameLower)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!nfSnapshot.empty) {
        const nfDoc = nfSnapshot.docs[0];
        console.log(
          '[MEMBER-SEND-INVITATION] ⚡ MATCH FOUND in notFoundRegistry:',
          nfDoc.id
        );

        // Update notFoundRegistry entry - mark as invited
        await db.collection('notFoundRegistry').doc(nfDoc.id).update({
          status: 'invited',
          invitedAt: new Date().toISOString(),
          inviteId: inviteRef.id,
          invitedBy: memberCode,
        });

        console.log(
          '[MEMBER-SEND-INVITATION] ✅ Updated notFoundRegistry status to "invited"'
        );
      }
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
