export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

/**
 * POST /api/trust/bonds/accept
 * Accept a pending trust bond request
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('API Request: POST /api/trust/bonds/accept', 'API');
    
    const body = await req.json();
    const { bondId, memberCode } = body;
    
    // Validate required fields
    if (!bondId || !memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: bondId, memberCode" },
        { status: 400 }
      );
    }
    
    const db = getDb();
    
    // Get the bond
    const bondDoc = await db.collection('trustBonds').doc(bondId).get();
    
    if (!bondDoc.exists) {
      return NextResponse.json(
        { ok: false, error: "Trust bond not found" },
        { status: 404 }
      );
    }
    
    const bondData = bondDoc.data();
    
    // Verify the accepting member is the recipient
    if (bondData?.toMemberCode !== memberCode) {
      return NextResponse.json(
        { ok: false, error: "You are not authorized to accept this trust bond" },
        { status: 403 }
      );
    }
    
    // Check if already accepted or rejected
    if (bondData?.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Trust bond is already ${bondData?.status}` },
        { status: 400 }
      );
    }
    
    // Update bond status to accepted
    await bondDoc.ref.update({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create trust connection (bidirectional)
    const connectionData = {
      member1Code: bondData?.fromMemberCode,
      member2Code: bondData?.toMemberCode,
      member1Name: bondData?.fromMemberName,
      member2Name: bondData?.toMemberName,
      bondId: bondId,
      status: 'active',
      createdAt: new Date()
    };
    
    await db.collection('trustConnections').add(connectionData);
    
    // Update trust unit membership (if applicable)
    // This could trigger trust unit creation or expansion
    await updateTrustUnits(db, bondData?.fromMemberCode, bondData?.toMemberCode);
    
    logger.info(`Trust bond accepted: ${bondId}`, 'TrustBonds', {
      fromMemberCode: bondData?.fromMemberCode,
      toMemberCode: bondData?.toMemberCode
    });
    
    return NextResponse.json({
      ok: true,
      bond: {
        id: bondId,
        status: 'accepted',
        ...bondData
      },
      message: "Trust bond accepted successfully"
    });
    
  } catch (error: any) {
    logger.error('Error accepting trust bond', error, 'TrustBonds');
    return NextResponse.json(
      { ok: false, error: "Failed to accept trust bond", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Update trust units when a bond is accepted
 */
async function updateTrustUnits(db: any, memberCode1: string, memberCode2: string) {
  try {
    // Check if either member is already in a trust unit
    const unit1Query = await db.collection('trustUnits')
      .where('members', 'array-contains', memberCode1)
      .limit(1)
      .get();
    
    const unit2Query = await db.collection('trustUnits')
      .where('members', 'array-contains', memberCode2)
      .limit(1)
      .get();
    
    if (unit1Query.empty && unit2Query.empty) {
      // Neither member has a trust unit - create new one
      await db.collection('trustUnits').add({
        members: [memberCode1, memberCode2],
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 2
      });
    } else if (!unit1Query.empty && unit2Query.empty) {
      // Member 1 has unit, add member 2
      const unitDoc = unit1Query.docs[0];
      const unitData = unitDoc.data();
      await unitDoc.ref.update({
        members: [...unitData.members, memberCode2],
        size: unitData.members.length + 1,
        updatedAt: new Date()
      });
    } else if (unit1Query.empty && !unit2Query.empty) {
      // Member 2 has unit, add member 1
      const unitDoc = unit2Query.docs[0];
      const unitData = unitDoc.data();
      await unitDoc.ref.update({
        members: [...unitData.members, memberCode1],
        size: unitData.members.length + 1,
        updatedAt: new Date()
      });
    } else {
      // Both have units - merge them
      const unit1Doc = unit1Query.docs[0];
      const unit2Doc = unit2Query.docs[0];
      const unit1Data = unit1Doc.data();
      const unit2Data = unit2Doc.data();
      
      // Merge into unit1, delete unit2
      const mergedMembers = [...new Set([...unit1Data.members, ...unit2Data.members])];
      await unit1Doc.ref.update({
        members: mergedMembers,
        size: mergedMembers.length,
        updatedAt: new Date()
      });
      await unit2Doc.ref.delete();
    }
  } catch (error) {
    logger.error('Error updating trust units', error as Error, 'TrustBonds');
    // Don't throw - trust unit update is non-critical
  }
}





















