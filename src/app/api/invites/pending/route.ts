import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { getAuthUser } from '@/lib/authContext';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'incoming';

  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: 'Not authenticated', items: [] }, { status: 401 });
    }

    const db = getDb();
    let items: any[] = [];

    if (type === 'incoming') {
      // invites where phone matches currentUser and status == 'pending'
      const snapshot = await db
        .collection('invites')
        .where('phone', '==', currentUser)
        .where('status', '==', 'pending')
        .get();
      
      items = snapshot.docs.map(doc => ({
        id: doc.id,
        from: {
          name: doc.data().sponsorName,
          memberCode: doc.data().sponsorId
        },
        createdAt: doc.data().createdAt
      }));
    } else if (type === 'outgoing') {
      // invites where sponsorId == currentUser and status in ['pending','sent']
      const snapshot = await db
        .collection('invites')
        .where('sponsorId', '==', currentUser)
        .where('status', 'in', ['pending', 'sent'])
        .get();
      
      items = snapshot.docs.map(doc => ({
        id: doc.id,
        to: {
          phone: doc.data().phone,
          email: doc.data().email
        },
        status: doc.data().status,
        createdAt: doc.data().createdAt
      }));
    } else if (type === 'recent') {
      // trustBonds where status == 'connected', ordered by connectedAt desc, limit 5
      const snapshot = await db
        .collection('trustBonds')
        .where('status', '==', 'connected')
        .orderBy('connectedAt', 'desc')
        .limit(5)
        .get();
      
      items = snapshot.docs.map(doc => ({
        id: doc.id,
        memberName: doc.data().memberName || doc.data().toMemberName,
        memberCode: doc.data().memberCode || doc.data().toMemberCode,
        connectedAt: doc.data().connectedAt
      }));
    }

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error('Error in /api/invites/pending:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'pending failed', items: [] }, { status: 500 });
  }
}
