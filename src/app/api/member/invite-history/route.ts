import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');

    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: 'Member code is required' },
        { status: 400 }
      );
    }

    console.log(`[INVITE-HISTORY] Loading invites for member: ${memberCode}`);

    try {
      const db = getDb();

      // Get invites sent by this member
      const invitesSnapshot = await db
        .collection('invites')
        .where('sponsorMemberCode', '==', memberCode)
        .get();

      const invites = invitesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.invitedName || data.name || 'Unknown',
          firstName: (data.invitedName || data.name || 'Unknown').split(' ')[0],
          lastName: (data.invitedName || data.name || 'Unknown').split(' ').slice(1).join(' ') || '',
          phone: data.invitedPhone || data.phone || '',
          invitedAt: data.createdAt,
          sponsorName: data.sponsorName || 'Unknown',
          status: data.status || 'sent',
          message: data.message || '',
        };
      });

      console.log(`[INVITE-HISTORY] Found ${invites.length} invites for member ${memberCode}`);

      return NextResponse.json({
        ok: true,
        invites: invites || [],
        count: invites?.length || 0,
      });
    } catch (dbError: any) {
      console.error('Database error in invite history:', dbError);
      
      // Return empty array instead of error to prevent UI crashes
      console.log('[INVITE-HISTORY] Database unavailable, returning empty array');
      return NextResponse.json({
        ok: true,
        invites: [],
        count: 0,
        warning: 'Database temporarily unavailable'
      });
    }
  } catch (error: any) {
    console.error('Get invite history error:', error);
    
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json({
      ok: true,
      invites: [],
      count: 0,
      warning: 'Service temporarily unavailable'
    });
  }
}