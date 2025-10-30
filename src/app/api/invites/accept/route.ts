import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const { inviteCode = "INV-DEMO", memberProfile = {} } = body || {};
    const memberCode = "MEM-" + Math.random().toString(36).slice(2,8).toUpperCase();

    try {
      const ref = await db.collection("members").add({
        inviteCode, memberProfile, memberCode, createdAt: new Date().toISOString()
      });
      return NextResponse.json({ ok: true, memberId: ref.id, memberCode }, { status:200 });
    } catch {
      return NextResponse.json({ ok: true, memberId: "local-" + Date.now(), memberCode }, { status:200 });
    }
  } catch (err:any) {
    return NextResponse.json({ ok:false, error:"member_accept_failed", detail:String(err?.message ?? err) }, { status:500 });
  }
}
