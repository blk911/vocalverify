import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { memberCode, phoneDigits, name } = await req.json();
    
    if (!memberCode || !phoneDigits) {
      return NextResponse.json(
        { ok: false, error: "Member code and phone digits are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Update user status to registered
    await db.collection('users').doc(memberCode).update({
      status: 'registered',
      phone: phoneDigits,
      name: name || null,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Look for sponsor information
    const invitesSnapshot = await db.collection('invites')
      .where('inviteeEmail', '==', phoneDigits)
      .limit(1)
      .get();
    
    if (!invitesSnapshot.empty) {
      const inviteDoc = invitesSnapshot.docs[0];
      const inviteData = inviteDoc.data();
      
      // Update user with sponsor info
      await db.collection('users').doc(memberCode).update({
        sponsorId: inviteData.inviterUid,
        sponsorName: inviteData.inviterName,
        sponsorMemberCode: inviteData.inviterMemberCode
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Registration completed successfully",
      user: {
        memberCode: memberCode,
        status: 'registered',
        phone: phoneDigits,
        name: name
      }
    });

  } catch (error: any) {
    console.error('Error completing registration:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to complete registration" },
      { status: 500 }
    );
  }
}
