import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      ok: false,
      error: 'Use POST method to create users',
      code: 'METHOD_NOT_ALLOWED',
    },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { name, memberCode, phone } = await req.json();

    // Validate required fields
    if (!name || !memberCode || !phone) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate member code format (should be numeric)
    if (!/^\d+$/.test(memberCode)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid member code',
          code: 'INVALID_MEMBER_CODE',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const db = getDb();
    const userRef = db.collection('users').doc(memberCode);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'User already exists', code: 'USER_EXISTS' },
        { status: 409 }
      );
    }

    // Create new user
    const userData = {
      name: name.trim(),
      memberCode: memberCode,
      phone: phone.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      hasVoice: false,
      voiceUrl: null,
    };

    await userRef.set(userData);

    // ✅ FIX: Update matching invite status to 'matched'
    try {
      console.log('🔍 [USER-CREATE] Looking for matching invite...');
      console.log('Phone:', phone.trim());
      
      // Find invite with matching phone number (both 'sent' and 'pending' status)
      const invitesSnapshot = await db.collection('invites')
        .where('phone', '==', phone.trim())
        .where('status', 'in', ['sent', 'pending'])
        .get();
      
      if (!invitesSnapshot.empty) {
        const inviteDoc = invitesSnapshot.docs[0];
        const inviteData = inviteDoc.data();
        
        console.log('✅ [USER-CREATE] Found matching invite:', inviteData.name);
        
        // Update invite status to 'matched'
        await db.collection('invites').doc(inviteDoc.id).update({
          status: 'matched',
          inviteeId: memberCode,
          matchedPhone: phone.trim(),
          matchedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        console.log('✅ [USER-CREATE] Updated invite status to matched');
        
        // ✅ NEW: Create TB prospect when invite is matched
        try {
          console.log('🔗 [USER-CREATE] Creating TB prospect...');
          const tbProspectResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/trust-bonds/prospect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromMemberCode: inviteData.sponsorId || inviteData.sponsorMemberCode,
              toMemberCode: memberCode,
              message: `Trust bond prospect from ${inviteData.sponsorName}`,
              type: 'sponsor'
            }),
          });
          
          if (tbProspectResponse.ok) {
            const tbData = await tbProspectResponse.json();
            console.log('✅ [USER-CREATE] TB prospect created:', tbData.prospectId);
          } else {
            console.log('⚠️ [USER-CREATE] TB prospect creation failed');
          }
        } catch (tbError) {
          console.error('❌ [USER-CREATE] Error creating TB prospect:', tbError);
        }
      } else {
        console.log('⚠️ [USER-CREATE] No matching invite found for phone:', phone.trim());
      }
    } catch (inviteError) {
      console.error('❌ [USER-CREATE] Error updating invite status:', inviteError);
      // Don't fail user creation if invite update fails
    }

    return NextResponse.json({
      ok: true,
      message: 'User created successfully',
      user: {
        memberCode,
        name,
        status: 'pending',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'Failed to create user', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
