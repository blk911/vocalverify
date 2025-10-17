import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { asyncHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  logger.info('API Request: GET /api/invites/list', 'API');
  
  const { searchParams } = new URL(req.url);
  const memberCode = searchParams.get('memberCode');
  
  if (!memberCode) {
    throw new Error("Member code is required");
  }

  const db = getDb();
  
  try {
    // Get invites sent by this member
    const invitesSnapshot = await db.collection('invites')
      .where('sponsorMemberCode', '==', memberCode)
      .get();
    
    // Sort in memory instead of using orderBy (avoids Firestore index requirement)
    const invites = invitesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
        // Sort by createdAt descending
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    
    logger.info('API Response: GET /api/invites/list', 'API', { count: invites.length });
    
    return NextResponse.json({
      ok: true,
      invites,
      count: invites.length
    });
    
  } catch (error: any) {
    logger.error('Error fetching invites', error, 'InvitesList', { memberCode });
    throw error;
  }
}
