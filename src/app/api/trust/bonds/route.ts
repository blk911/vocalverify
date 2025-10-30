import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const { title = "Bond", members = ["A","B"], inviteCode = null } = body || {};

    try {
      const ref = await db.collection("trustBonds").add({
        title, members, inviteCode, status: "created", createdAt: new Date().toISOString()
      });
      return NextResponse.json({ ok: true, tbId: ref.id }, { status:200 });
    } catch {
      return NextResponse.json({ ok: true, tbId: "local-" + Date.now() }, { status:200 });
    }
  } catch (err:any) {
    return NextResponse.json({ ok:false, error:"tb_create_failed", detail:String(err?.message ?? err) }, { status:500 });
  }
}
