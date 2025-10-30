import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const { toPhone = null, toEmail = null, sponsorCode = "DEMO" } = body || {};
    const inviteCode = "INV-" + Math.random().toString(36).slice(2,8).toUpperCase();

    try {
      const ref = await db.collection("invites").add({
        toPhone, toEmail, sponsorCode, inviteCode, status: "sent",
        createdAt: new Date().toISOString()
      });
      return NextResponse.json({ ok: true, inviteId: ref.id, inviteCode }, { status: 200 });
    } catch {
      return NextResponse.json({ ok: true, inviteId: "local-" + Date.now(), inviteCode }, { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json({ ok:false, error:"invite_send_failed", detail:String(err?.message ?? err) }, { status:500 });
  }
}
