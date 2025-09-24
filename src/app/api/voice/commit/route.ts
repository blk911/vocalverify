import { NextResponse } from "next/server";
import { db, storage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { uploadId } = await req.json().catch(() => ({}));
  if (!uploadId) return NextResponse.json({ error: "missing uploadId" }, { status: 400 });

  const path = `voice/${uploadId}.webm`;
  const fileRef = storage.bucket().file(path);
  const [exists] = await fileRef.exists();
  if (!exists) return NextResponse.json({ error: "upload not found", path }, { status: 404 });

  await db.collection("voice_uploads").doc(uploadId).set({
    createdAt: Date.now(),
    path,
    contentType: "audio/webm",
  }, { merge: true });

  const [url] = await fileRef.getSignedUrl({ action: "read", expires: Date.now() + 60*60*1000 });
  return NextResponse.json({ ok: true, uploadId, url });
}
