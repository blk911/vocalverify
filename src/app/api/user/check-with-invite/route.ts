import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { asyncHandler, handleApiError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const GET = asyncHandler(async (req: NextRequest) => {
  logger.info('API Request: GET /api/user/check-with-invite', 'API');
  
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  
  if (!name) {
    throw new Error("Name is required");
  }

  logger.info(`Checking user with invite: ${name}`, 'UserCheck');

  const db = getDb();
  const nameLower = name.trim().toLowerCase();
  
  try {
    // Check if user exists (case-insensitive)
    const usersSnapshot = await db.collection('users')
      .where('nameLower', '==', nameLower)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      
      logger.info(`User found: ${name}`, 'UserCheck', { memberCode: userDoc.id });
      
      return NextResponse.json({
        ok: true,
        exists: true,
        user: {
          memberCode: userDoc.id,
          name: userData.name,
          status: userData.status
        }
      });
    }

    // Check for pending invites ONLY in invites collection (proper architecture)
    const invitesSnapshot = await db.collection('invites')
      .where('nameLower', '==', nameLower)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (!invitesSnapshot.empty) {
      const inviteDoc = invitesSnapshot.docs[0];
      const inviteData = inviteDoc.data();
      
      logger.info(`Pending invite found for: ${name}`, 'UserCheck', { inviteId: inviteDoc.id });
      
      const inviteResponse = {
        id: inviteDoc.id,
        name: inviteData.name,
        phone: inviteData.phone,
        sponsorName: inviteData.sponsorName,
        sponsorId: inviteData.sponsorId  // ✅ CRITICAL FIX: Must return sponsorId!
      };
      
      console.log('\n🔥 [CHECK-WITH-INVITE] INVITE FOUND 🔥');
      console.log('[CHECK-WITH-INVITE] Invite data:', inviteResponse);
      console.log('[CHECK-WITH-INVITE] Has sponsorId?', !!inviteData.sponsorId);
      console.log('[CHECK-WITH-INVITE] Is admin invite?', inviteData.sponsorId === '0000000000');
      
      return NextResponse.json({
        ok: true,
        exists: false,
        hasInvite: true,
        invite: inviteResponse
      });
    }

    logger.info(`No user or invite found for: ${name}`, 'UserCheck');
    
    return NextResponse.json({
      ok: true,
      exists: false,
      hasInvite: false,
      message: "User not found and no pending invite"
    });

  } catch (error: any) {
    logger.error('Database error in check-with-invite', error, 'UserCheck', { name });
    throw error;
  }
});
