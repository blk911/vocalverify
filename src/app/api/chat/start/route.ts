import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { memberCode = "demo", title = "New Thread" } = body;

    const docRef = await db.collection("threads").add({
      memberCode,
      title,
      messagesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, threadId: docRef.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "thread_create_failed", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
