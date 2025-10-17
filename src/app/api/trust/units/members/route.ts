export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

/**
 * GET /api/trust/units/members?memberCode=xxx
 * Get all members in a member's trust unit with full details
 */
export async function GET(req: NextRequest) {
  try {
    logger.info('API Request: GET /api/trust/units/members', 'API');
    
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    const tuId = searchParams.get('tuId');
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing required parameter: memberCode" },
        { status: 400 }
      );
    }
    
    const db = getDb();
    
    // Check if member exists
    const memberDoc = await db.collection('users').doc(memberCode).get();
    if (!memberDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "Member not found" },
        { status: 404 }
      );
    }
    
    let trustUnitDoc;
    
    if (tuId) {
      // If tuId is provided, get that specific trust unit
      console.log('🔍 Getting specific TU by ID:', tuId);
      trustUnitDoc = await db.collection('trustUnits').doc(tuId).get();
      if (!trustUnitDoc.exists) {
        console.error('❌ TU not found with ID:', tuId);
        return NextResponse.json({
          ok: false,
          error: "Trust unit not found"
        }, { status: 404 });
      }
      console.log('✅ Found TU by ID:', tuId);
    } else {
      // Find member's trust unit
      const trustUnitQuery = await db.collection('trustUnits')
        .where('memberCodes', 'array-contains', memberCode)
        .limit(1)
        .get();
      
      if (trustUnitQuery.empty) {
        return NextResponse.json({
          ok: true,
          memberCode,
          trustUnitId: null,
          members: [],
          count: 0,
          message: "Member is not part of any trust unit"
        });
      }
      
      trustUnitDoc = trustUnitQuery.docs[0];
    }
    const trustUnitData = trustUnitDoc.data();
    if (!trustUnitData) {
      return NextResponse.json({
        ok: false,
        error: 'Trust Unit data not found'
      }, { status: 404 });
    }
    const memberCodes = trustUnitData.memberCodes || [];
    
    // Get full details for all members in the trust unit
    const memberDetails = await Promise.all(
      memberCodes.map(async (code: string) => {
        try {
          const userDoc = await db.collection('users').doc(code).get();
          if (!userDoc.exists) {
            return {
              memberCode: code,
              name: 'Unknown',
              status: 'not_found',
              profilePicture: null,
              hasVoice: false
            };
          }
          
          const userData = userDoc.data();
          
          // Check if this member has a direct connection with the requesting member
          let connectionStatus = 'indirect';
          if (code === memberCode) {
            connectionStatus = 'self';
          } else {
            const directConnection = await db.collection('trustConnections')
              .where('member1Code', 'in', [memberCode, code])
              .where('member2Code', 'in', [memberCode, code])
              .limit(1)
              .get();
            
            if (!directConnection.empty) {
              connectionStatus = 'direct';
            }
          }
          
          return {
            memberCode: code,
            name: userData?.name || 'Unknown',
            status: userData?.status || 'unknown',
            profilePicture: userData?.profilePicture || null,
            hasVoice: userData?.hasVoice || false,
            phone: userData?.phone || null,
            createdAt: userData?.createdAt,
            connectionStatus
          };
        } catch (error) {
          logger.error(`Error fetching member details for ${code}`, error as Error, 'TrustUnits');
          return {
            memberCode: code,
            name: 'Error',
            status: 'error',
            profilePicture: null,
            hasVoice: false
          };
        }
      })
    );
    
    logger.info(`Trust unit members retrieved for ${memberCode}`, 'TrustUnits', {
      unitId: trustUnitDoc.id,
      count: memberDetails.length
    });
    
    return NextResponse.json({
      ok: true,
      memberCode,
      trustUnitId: trustUnitDoc.id,
      tuName: trustUnitData?.tuName || null, // ✅ Include TU name
      sponsorCode: trustUnitData?.sponsorCode || null, // ✅ Include sponsor info
      sponsorName: trustUnitData?.sponsorName || null,
      members: memberDetails,
      count: memberDetails.length,
      directConnections: memberDetails.filter(m => m.connectionStatus === 'direct').length,
      indirectConnections: memberDetails.filter(m => m.connectionStatus === 'indirect').length
    });
    
  } catch (error: any) {
    logger.error('Error getting trust unit members', error, 'TrustUnits');
    return NextResponse.json(
      { ok: false, error: "Failed to get trust unit members", details: error.message },
      { status: 500 }
    );
  }
}













