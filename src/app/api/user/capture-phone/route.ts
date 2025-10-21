import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { normalizeName } from '@/utils/nameUtils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, firstName, lastName, inviteId } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const phoneDigits = phone.trim();

    // Normalize name using site-wide utility
    const { name: properName, nameLower } = normalizeName(name);

    console.log('[CAPTURE-PHONE] Request:', {
      inputName: name,
      properName,
      nameLower,
      phone: phoneDigits,
      inviteId,
    });

    // Check if this matches a pending invite
    let matchedInvite = null;

    if (inviteId) {
      // Invite ID provided, check ONLY invites collection
      const inviteDoc = await db.collection('invites').doc(inviteId).get();
      if (inviteDoc.exists) {
        matchedInvite = { id: inviteDoc.id, ...inviteDoc.data() };
      }
    } else {
      // Search for invite by name (case-insensitive) ONLY in invites collection
      const inviteSnapshot = await db
        .collection('invites')
        .where('nameLower', '==', nameLower)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (!inviteSnapshot.empty) {
        const inviteDoc = inviteSnapshot.docs[0];
        matchedInvite = { id: inviteDoc.id, ...inviteDoc.data() };
      }
    }

    if (matchedInvite) {
      console.log('[CAPTURE-PHONE] Matched invite found:', matchedInvite.id);

      // ✅ CRITICAL: VALIDATE PHONE MATCHES INVITE
      if ((matchedInvite as any).phone && (matchedInvite as any).phone.trim()) {
        const invitePhone = (matchedInvite as any).phone
          .trim()
          .replace(/\D/g, '');
        const enteredPhone = phoneDigits.replace(/\D/g, '');

        if (invitePhone !== enteredPhone) {
          console.error('[CAPTURE-PHONE] ❌ Phone mismatch!', {
            invitePhone,
            enteredPhone,
            invite: matchedInvite.id,
          });

          return NextResponse.json(
            {
              ok: false,
              error:
                'Phone number does not match the invite. Please use the phone number associated with this invitation.',
              code: 'PHONE_MISMATCH',
              expectedPhone: (matchedInvite as any).phone,
            },
            { status: 400 }
          );
        }

        console.log('[CAPTURE-PHONE] ✅ Phone validated successfully');
      }

      // ✅ PHASE 1: Calculate rootSponsorId and depth
      const sponsorMemberCode =
        (matchedInvite as any).sponsorMemberCode ||
        (matchedInvite as any).sponsorId ||
        '0000000000';
      let rootSponsorId = sponsorMemberCode;
      let depth = 1;

      if (sponsorMemberCode !== '0000000000') {
        // Fetch sponsor to get their root
        const sponsorDoc = await db
          .collection('users')
          .doc(sponsorMemberCode)
          .get();
        if (sponsorDoc.exists) {
          const sponsorData = sponsorDoc.data();
          // If sponsor has a root, inherit it (otherwise sponsor IS the root)
          rootSponsorId = sponsorData?.rootSponsorId || sponsorMemberCode;
          depth = (sponsorData?.depth || 0) + 1;

          console.log('[CAPTURE-PHONE] Root/depth calculated:', {
            sponsor: sponsorMemberCode,
            rootSponsorId,
            depth,
          });
        }
      } else {
        // Admin invite → this user IS the root
        rootSponsorId = phoneDigits;
        depth = 0;
      }

      // Create user account with invite data + root/depth
      const userData = {
        name: properName,
        nameLower: nameLower,
        phone: phoneDigits,
        memberCode: phoneDigits,
        status: 'pending',
        sponsorId: (matchedInvite as any).sponsorId || '0000000000',
        sponsorName: (matchedInvite as any).sponsorName || 'Admin',
        sponsorMemberCode: sponsorMemberCode,
        rootSponsorId, // ✅ NEW: immutable root sponsor
        depth, // ✅ NEW: depth from root
        inviteId: matchedInvite.id,
        createdAt: new Date().toISOString(),
        source:
          (matchedInvite as any).sponsorId === '0000000000'
            ? 'admin_invite'
            : 'member_invite',
      };

      // Use phone as document ID (memberCode)
      await db.collection('users').doc(phoneDigits).set(userData);

      // Update invite status ONLY in invites collection + set inviteeId
      await db.collection('invites').doc(matchedInvite.id).update({
        status: 'matched',
        inviteeId: phoneDigits, // ✅ NEW: set inviteeId on acceptance
        matchedPhone: phoneDigits,
        matchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('[CAPTURE-PHONE] User created from invite:', phoneDigits);

      return NextResponse.json({
        ok: true,
        message: 'Account created successfully',
        hasInvite: true,
        user: {
          ...userData,
          memberCode: phoneDigits,
        },
      });
    }

    // No invite found - create not found registry entry
    console.log('[CAPTURE-PHONE] No invite found, creating registry entry');

    const notFoundData = {
      name: properName,
      nameLower: nameLower,
      phone: phoneDigits,
      firstName: firstName || null,
      lastName: lastName || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: 'phone_capture',
    };

    const docRef = await db.collection('notFoundRegistry').add(notFoundData);

    return NextResponse.json({
      ok: true,
      message: 'Phone captured successfully',
      hasInvite: false,
      entry: {
        id: docRef.id,
        ...notFoundData,
      },
    });
  } catch (error: any) {
    console.error('[CAPTURE-PHONE] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to capture phone' },
      { status: 500 }
    );
  }
}
