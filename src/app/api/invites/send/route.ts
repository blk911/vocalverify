import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { normalizeName } from '@/utils/nameUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔥🔥🔥 [INVITES-SEND] API CALLED 🔥🔥🔥');
    const body = await request.json();
    const { memberCode, invitedName, invitedPhone } = body;
    
    console.log('[INVITES-SEND] Request:', { memberCode, invitedName, invitedPhone });

    if (!memberCode || !invitedName || !invitedPhone) {
      console.log('[INVITES-SEND] ❌ Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const invitesRef = db.collection('invites');
    
    // Normalize name for matching
    const { name: properName, nameLower } = normalizeName(invitedName);
    console.log('[INVITES-SEND] Name normalized:', { input: invitedName, properName, nameLower });
    
    // Get member data to get sponsor name
    console.log('[INVITES-SEND] Fetching sponsor data for memberCode:', memberCode);
    const memberDoc = await db.collection('users').doc(memberCode).get();
    const memberData = memberDoc.exists ? memberDoc.data() : null;
    
    if (!memberData) {
      console.log('[INVITES-SEND] ❌ Member not found:', memberCode);
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    console.log('[INVITES-SEND] Sponsor info:', { 
      sponsorId: memberCode,
      sponsorName: memberData?.name || memberData?.fullName,
      sponsorMemberCode: memberCode
    });
    
    const inviteData = {
      name: properName,              // ✅ Added for check-with-invite compatibility
      nameLower: nameLower,
      phone: invitedPhone,           // ✅ Added for check-with-invite compatibility
      invitedPhone,                  // Keep original field
      invitedName: properName,       // Keep original field
      sponsorId: memberCode,
      sponsorName: memberData?.name || memberData?.fullName || 'Member',
      sponsorMemberCode: memberCode,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    console.log('[INVITES-SEND] Creating invite with data:', inviteData);
    const docRef = await invitesRef.add(inviteData);
    
    console.log('✅ [INVITES-SEND] Invite created successfully:', docRef.id);

    // ⚡ CRITICAL: Check if this name exists in notFoundRegistry
    const nfSnapshot = await db.collection('notFoundRegistry')
      .where('nameLower', '==', nameLower)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (!nfSnapshot.empty) {
      const nfDoc = nfSnapshot.docs[0];
      console.log('[INVITES-SEND] ⚡ MATCH FOUND in notFoundRegistry:', nfDoc.id);
      
      // Update notFoundRegistry entry - mark as invited
      await db.collection('notFoundRegistry').doc(nfDoc.id).update({
        status: 'invited',
        invitedAt: new Date().toISOString(),
        inviteId: docRef.id,
        invitedBy: memberCode
      });
      
      console.log('[INVITES-SEND] ✅ Updated notFoundRegistry status to "invited"');
    }

    console.log('\n🎉 [INVITES-SEND] COMPLETE - Invite ready for use\n');
    
    return NextResponse.json({ 
      success: true, 
      inviteId: docRef.id,
      message: 'Invite sent successfully' 
    });
  } catch (error) {
    console.error('\n❌❌❌ [INVITES-SEND] ERROR ❌❌❌');
    console.error('[INVITES-SEND] Error details:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
