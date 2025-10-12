export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

/**
 * GET /api/trust/units/status?memberCode=xxx
 * Get trust unit status for a member
 */
export async function GET(req: NextRequest) {
  try {
    logger.info('API Request: GET /api/trust/units/status', 'API');
    
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    
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
    
    // Find member's trust unit
    const trustUnitQuery = await db.collection('trustUnits')
      .where('members', 'array-contains', memberCode)
      .limit(1)
      .get();
    
    if (trustUnitQuery.empty) {
      return NextResponse.json({
        ok: true,
        status: 'no_unit',
        memberCode,
        message: "Member is not part of any trust unit",
        trustUnit: null,
        connections: 0,
        pendingBonds: 0
      });
    }
    
    const trustUnitDoc = trustUnitQuery.docs[0];
    const trustUnitData = trustUnitDoc.data();
    
    // Get active connections count
    const connectionsQuery = await db.collection('trustConnections')
      .where('member1Code', '==', memberCode)
      .get();
    
    const connectionsQuery2 = await db.collection('trustConnections')
      .where('member2Code', '==', memberCode)
      .get();
    
    const totalConnections = connectionsQuery.size + connectionsQuery2.size;
    
    // Get pending bonds (incoming)
    const pendingBondsQuery = await db.collection('trustBonds')
      .where('toMemberCode', '==', memberCode)
      .where('status', '==', 'pending')
      .get();
    
    // Get pending bonds (outgoing)
    const outgoingBondsQuery = await db.collection('trustBonds')
      .where('fromMemberCode', '==', memberCode)
      .where('status', '==', 'pending')
      .get();
    
    logger.info(`Trust unit status retrieved for ${memberCode}`, 'TrustUnits', {
      unitId: trustUnitDoc.id,
      size: trustUnitData.members?.length || 0
    });
    
    return NextResponse.json({
      ok: true,
      status: 'active',
      memberCode,
      trustUnit: {
        id: trustUnitDoc.id,
        size: trustUnitData.members?.length || 0,
        members: trustUnitData.members || [],
        createdAt: trustUnitData.createdAt,
        updatedAt: trustUnitData.updatedAt
      },
      connections: totalConnections,
      pendingBonds: {
        incoming: pendingBondsQuery.size,
        outgoing: outgoingBondsQuery.size,
        total: pendingBondsQuery.size + outgoingBondsQuery.size
      }
    });
    
  } catch (error: any) {
    logger.error('Error getting trust unit status', error, 'TrustUnits');
    return NextResponse.json(
      { ok: false, error: "Failed to get trust unit status", details: error.message },
      { status: 500 }
    );
  }
}









