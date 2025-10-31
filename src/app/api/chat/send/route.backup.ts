import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { threadId, text, sender = "system" } = body ?? {};
    if (!threadId || !text) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const msgRef = await db.collection("threads").doc(threadId).collection("messages").add({
      text, sender,
      createdAt: new Date().toISOString(),
    });

    await db.collection("threads").doc(threadId).update({
      messagesCount: db.FieldValue?.increment ? db.FieldValue.increment(1) : (await (async () => {
        const snap = await db.collection("threads").doc(threadId).get();
        const current = (snap.data()?.messagesCount ?? 0) + 1;
        return { messagesCount: current };
      })())
    });

    return NextResponse.json({ ok: true, messageId: msgRef.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "message_send_failed", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
