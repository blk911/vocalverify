import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { getAuthUser } from '@/lib/authContext';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inviteId, action }:{ inviteId?: string; action?: 'accept'|'decline' } = body || {};

    if (!inviteId || !action) {
      return NextResponse.json({ ok:false, error:'missing inviteId/action' }, { status: 400 });
    }

    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();

    // Get the invite document
    const inviteRef = db.collection('invites').doc(inviteId);
    const inviteDoc = await inviteRef.get();
    
    if (!inviteDoc.exists) {
      return NextResponse.json({ ok: false, error: 'Invite not found' }, { status: 404 });
    }

    const inviteData = inviteDoc.data();

    if (action === 'accept') {
      // Update invite status to accepted
      await inviteRef.update({
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: currentUser
      });

      // Create new trust bond
      const trustBondData = {
        members: [inviteData?.sponsorId, currentUser],
        fromUser: inviteData?.sponsorId,
        toUser: currentUser,
        fromMemberCode: inviteData?.sponsorId,
        toMemberCode: currentUser,
        fromMemberName: inviteData?.sponsorName,
        toMemberName: 'Pending Registration', // Will be updated when user registers
        status: 'connected',
        createdAt: new Date(),
        connectedAt: new Date(),
        inviteId: inviteId
      };

      await db.collection('trustBonds').add(trustBondData);

      console.log('✅ Invite accepted and trust bond created:', inviteId);
    } else if (action === 'decline') {
      // Update invite status to declined
      await inviteRef.update({
        status: 'declined',
        declinedAt: new Date().toISOString(),
        declinedBy: currentUser
      });

      console.log('✅ Invite declined:', inviteId);
    }

    return NextResponse.json({ ok: true, inviteId, action });
  } catch (e: any) {
    console.error('Error in /api/invites/respond:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'respond failed' }, { status: 500 });
  }
}
