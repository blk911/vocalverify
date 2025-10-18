import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { normalizeName } from '@/utils/nameUtils';
import { checkInviteBlock, detectCircularInvite } from '@/lib/tuBlockerUtil';
import { getFeatureFlags } from '@/lib/featureFlags';
import { logInviteBlocked, logCircularInvite } from '@/lib/telemetry';

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
    
    // ✅ PHASE 5: Get feature flags
    const flags = getFeatureFlags();
    
    // ✅ PHASE 4: Check if invite should be blocked (same TU)
    if (flags.tuInviteBlocker) {
      console.log('[INVITES-SEND] Checking for duplicate TU membership (ENABLED)...');
      const blockerResult = await checkInviteBlock(memberCode, properName, invitedPhone);
      
      if (blockerResult.shouldBlock) {
        console.log(`⚠️  [INVITES-SEND] BLOCKED: ${blockerResult.reason}`);
        
        // ✅ PHASE 5: Log telemetry
        logInviteBlocked(memberCode, properName, blockerResult.reason, blockerResult.existingTUId);
        
        return NextResponse.json({ 
          error: blockerResult.reason,
          code: 'ALREADY_IN_TU',
          existingTUId: blockerResult.existingTUId
        }, { status: 409 }); // 409 Conflict
      }
    } else {
      console.log('[INVITES-SEND] TU invite blocker (DISABLED by feature flag)');
    }
    
    // ✅ PHASE 4: Check for circular invite (allowed, but log it)
    if (flags.circularInviteDetection) {
      const circularCheck = await detectCircularInvite(memberCode, invitedPhone);
      if (circularCheck.isCircular) {
        console.log(`📍 [INVITES-SEND] Circular invite detected (allowed): ${circularCheck.reason}`);
        
        // ✅ PHASE 5: Log telemetry
        logCircularInvite(memberCode, invitedPhone, true);
      }
    }
    
    // Get member data to get sponsor name AND rootSponsorId
    console.log('[INVITES-SEND] Fetching sponsor data for memberCode:', memberCode);
    const memberDoc = await db.collection('users').doc(memberCode).get();
    const memberData = memberDoc.exists ? memberDoc.data() : null;
    
    if (!memberData) {
      console.log('[INVITES-SEND] ❌ Member not found:', memberCode);
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    // ✅ Ensure inviter has rootSponsorId
    let inviterRootSponsorId = memberData?.rootSponsorId;
    if (!inviterRootSponsorId) {
      console.log('[INVITES-SEND] ⚠️ Inviter missing rootSponsorId, setting to self');
      await db.collection('users').doc(memberCode).update({
        rootSponsorId: memberCode,
        depth: 0,
        updatedAt: new Date().toISOString()
      });
      inviterRootSponsorId = memberCode;
    }
    
    console.log('[INVITES-SEND] Sponsor info:', { 
      sponsorId: memberCode,
      sponsorName: memberData?.name || memberData?.fullName,
      sponsorMemberCode: memberCode,
      rootSponsorId: inviterRootSponsorId
    });
    
    const inviteData = {
      name: properName,              // ✅ Added for check-with-invite compatibility
      nameLower: nameLower,
      phone: invitedPhone,           // ✅ Added for check-with-invite compatibility
      invitedPhone,                  // Keep original field
      invitedName: properName,       // Keep original field
      inviterId: memberCode,         // ✅ NEW: memberCode of sender
      inviteeId: null,               // ✅ NEW: set on acceptance/registration
      sponsorId: memberCode,         // Legacy compatibility
      sponsorName: memberData?.name || memberData?.fullName || 'Member',
      sponsorMemberCode: memberCode,
      rootSponsorId: inviterRootSponsorId,  // ✅ NEW: copy from inviter
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    console.log('[INVITES-SEND] Creating invite with data:', inviteData);
    const docRef = await invitesRef.add(inviteData);
    
    console.log('✅ [INVITES-SEND] Invite created successfully:', docRef.id);

    // 📱 QR CODE GENERATION: Generate QR code for the invite
    console.log('[INVITES-SEND] 📱 Generating QR code for invite...');
    try {
      const qrResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/invites/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: docRef.id,
          inviteeName: properName,
          inviteePhone: invitedPhone,
          inviterName: memberData?.name || memberData?.fullName || 'Member',
          inviterCode: memberCode
        })
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        console.log('✅ [INVITES-SEND] QR code generated successfully:', qrData.qrCodeUrl);
      } else {
        console.log('⚠️ [INVITES-SEND] QR code generation failed, but invite was created');
      }
    } catch (qrError) {
      console.error('[INVITES-SEND] QR code generation error:', qrError);
      // Don't fail the invite if QR generation fails
    }

    // 🔍 CROSS-CONNECTION DETECTION: Check for same-sponsor TU prospect
    console.log('[INVITES-SEND] 🔍 Checking for cross-connection TU prospect...');
    
    try {
      // Check if invitee is already registered with same sponsor
      const inviteeQuery = await db.collection('users')
        .where('phone', '==', invitedPhone)
        .where('status', '==', 'registered')
        .limit(1)
        .get();
      
      if (!inviteeQuery.empty) {
        const inviteeDoc = inviteeQuery.docs[0];
        const inviteeData = inviteeDoc.data();
        const inviteeMemberCode = inviteeDoc.id;
        
        console.log('[INVITES-SEND] Found registered invitee:', {
          memberCode: inviteeMemberCode,
          name: inviteeData?.name,
          sponsorId: inviteeData?.sponsorId,
          rootSponsorId: inviteeData?.rootSponsorId
        });
        
        // Check if both have same sponsor (cross-connection detected!)
        if (inviteeData?.sponsorId === memberData?.sponsorId && 
            inviteeData?.sponsorId !== '0000000000') {
          
          console.log('🎯 [INVITES-SEND] CROSS-CONNECTION DETECTED!');
          console.log(`   Inviter: ${memberCode} (sponsor: ${memberData?.sponsorId})`);
          console.log(`   Invitee: ${inviteeMemberCode} (sponsor: ${inviteeData?.sponsorId})`);
          console.log(`   Same sponsor: ${memberData?.sponsorId}`);
          
          // Create TU prospect immediately
          const { createTUProspect } = await import('@/lib/trustUnits');
          const prospectResult = await createTUProspect(memberCode, inviteeMemberCode);
          
          if (prospectResult.success) {
            console.log(`✅ [INVITES-SEND] TU prospect created: ${prospectResult.unitId}`);
            console.log(`   Status: ${prospectResult.status}`);
            console.log(`   Members: [${prospectResult.members?.join(', ') || 'none'}]`);
            
            // Return TU prospect data for immediate modal
            return NextResponse.json({ 
              success: true, 
              inviteId: docRef.id,
              message: 'Invite sent successfully',
              trustUnitProspect: {
                unitId: prospectResult.unitId,
                status: prospectResult.status,
                members: prospectResult.members,
                crossConnection: true
              }
            });
          } else {
            console.log(`❌ [INVITES-SEND] Failed to create TU prospect: ${prospectResult.error}`);
          }
        } else {
          console.log('[INVITES-SEND] No cross-connection (different sponsors or admin)');
        }
      } else {
        console.log('[INVITES-SEND] Invitee not yet registered, no cross-connection check');
      }
    } catch (crossError: any) {
      console.error('[INVITES-SEND] Error in cross-connection detection:', crossError);
      // Don't fail the invite if cross-connection check fails
    }

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
