import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { normalizeName } from "@/utils/nameUtils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, firstName, lastName, inviteId } = await req.json();
    
    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "Name and phone are required" },
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
      inviteId 
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
      const inviteSnapshot = await db.collection('invites')
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
      if (matchedInvite.phone && matchedInvite.phone.trim()) {
        const invitePhone = matchedInvite.phone.trim().replace(/\D/g, '');
        const enteredPhone = phoneDigits.replace(/\D/g, '');
        
        if (invitePhone !== enteredPhone) {
          console.error('[CAPTURE-PHONE] ❌ Phone mismatch!', {
            invitePhone,
            enteredPhone,
            invite: matchedInvite.id
          });
          
          return NextResponse.json({
            ok: false,
            error: "Phone number does not match the invite. Please use the phone number associated with this invitation.",
            code: "PHONE_MISMATCH",
            expectedPhone: matchedInvite.phone
          }, { status: 400 });
        }
        
        console.log('[CAPTURE-PHONE] ✅ Phone validated successfully');
      }
      
      // Create user account with invite data
      const userData = {
        name: properName,
        nameLower: nameLower,
        phone: phoneDigits,
        memberCode: phoneDigits,
        status: 'pending',
        sponsorId: matchedInvite.sponsorId || '0000000000',
        sponsorName: matchedInvite.sponsorName || 'Admin',
        sponsorMemberCode: matchedInvite.sponsorMemberCode || matchedInvite.sponsorId || '0000000000',
        inviteId: matchedInvite.id,
        createdAt: new Date().toISOString(),
        source: matchedInvite.sponsorId === '0000000000' ? 'admin_invite' : 'member_invite'
      };
      
      // Use phone as document ID (memberCode)
      await db.collection('users').doc(phoneDigits).set(userData);
      
      // Update invite status ONLY in invites collection
      await db.collection('invites').doc(matchedInvite.id).update({
        status: 'matched',
        matchedPhone: phoneDigits,
        matchedAt: new Date().toISOString()
      });
      
      console.log('[CAPTURE-PHONE] User created from invite:', phoneDigits);
      
      return NextResponse.json({
        ok: true,
        message: "Account created successfully",
        hasInvite: true,
        user: {
          memberCode: phoneDigits,
          ...userData
        }
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
      status: "pending",
      createdAt: new Date().toISOString(),
      source: "phone_capture"
    };

    const docRef = await db.collection('notFoundRegistry').add(notFoundData);

    return NextResponse.json({
      ok: true,
      message: "Phone captured successfully",
      hasInvite: false,
      entry: {
        id: docRef.id,
        ...notFoundData
      }
    });

  } catch (error: any) {
    console.error('[CAPTURE-PHONE] Error:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to capture phone" },
      { status: 500 }
    );
  }
}
