import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { recomputeTUStatus } from "@/lib/trustUnits";
import { logTUUpdate } from "@/lib/telemetry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('🔥🔥🔥 [TU-CONNECT] API CALLED 🔥🔥🔥');
    const { unitId, memberCode } = await req.json();
    
    console.log('[TU-CONNECT] Request:', { unitId, memberCode });
    
    if (!unitId || !memberCode) {
      console.log('[TU-CONNECT] ❌ Missing required fields');
      return NextResponse.json(
        { ok: false, error: "Unit ID and member code are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get the Trust Unit
    const unitDoc = await db.collection('trustUnits').doc(unitId).get();
    
    if (!unitDoc.exists) {
      console.log('[TU-CONNECT] ❌ Trust Unit not found');
      return NextResponse.json(
        { ok: false, error: "Trust Unit not found" },
        { status: 404 }
      );
    }
    
    const unitData = unitDoc.data();
    if (!unitData) {
      return NextResponse.json(
        { ok: false, error: "Trust Unit data not found" },
        { status: 404 }
      );
    }
    const members = unitData.members || [];
    
    // ✅ Idempotent: Check if already connected
    const memberIndex = members.findIndex((m: any) => 
      (typeof m === 'string' ? m : m.memberCode) === memberCode
    );
    
    if (memberIndex === -1) {
      console.log('[TU-CONNECT] ❌ Member not in TU');
      return NextResponse.json(
        { ok: false, error: "Member not found in Trust Unit" },
        { status: 404 }
      );
    }
    
    const currentMember = members[memberIndex];
    const currentStatus = typeof currentMember === 'string' ? null : currentMember.status;
    
    if (currentStatus === 'connected') {
      console.log('[TU-CONNECT] ℹ️ Member already connected (idempotent)');
      return NextResponse.json({
        ok: true,
        message: "Already connected to Trust Unit",
        status: unitData?.status || 'unknown'
      });
    }
    
    // Update the member's status to connected
    const updatedMembers = members.map((m: any, idx: number) => {
      if (idx === memberIndex) {
        return typeof m === 'string' 
          ? { memberCode: m, status: 'connected' }
          : { ...m, status: 'connected' };
      }
      return m;
    });
    
    // If this was a prospect, change status to pending_connections
    const newStatus = unitData?.status === 'prospect' ? 'pending_connections' : (unitData?.status || 'unknown');
    
    await unitDoc.ref.update({
      members: updatedMembers,
      status: newStatus,
      updatedAt: new Date()
    });
    
    console.log(`✅ [TU-CONNECT] Member ${memberCode} connected to TU ${unitId}`);
    console.log(`   Status changed from ${unitData?.status || 'unknown'} to ${newStatus}`);
    
    // Log telemetry
    logTUUpdate(unitId, 'member_connected', memberCode);
    
    // Recompute TU status
    await recomputeTUStatus(unitId);
    
    // Get updated status
    const updatedDoc = await unitDoc.ref.get();
    const finalStatus = updatedDoc.data()?.status || 'pending_connections';
    
    console.log(`✅ [TU-CONNECT] TU status: ${finalStatus}`);

    return NextResponse.json({
      ok: true,
      message: "Connected to Trust Unit successfully",
      status: finalStatus
    });

  } catch (error: any) {
    console.error('❌ [TU-CONNECT] Error:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to connect to trust unit" },
      { status: 500 }
    );
  }
}
