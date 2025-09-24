import { NextResponse } from "next/server";
import { db, storage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log('Voice commit API called');
    
    const { uploadId } = await req.json().catch(() => ({}));
    if (!uploadId) {
      console.error('Missing uploadId in request body');
      return NextResponse.json({ error: "missing uploadId" }, { status: 400 });
    }

    console.log('Checking for uploaded file:', { uploadId });

    const path = `voice/${uploadId}.webm`;
    const bucket = storage.bucket();
    const fileRef = bucket.file(path);
    const [exists] = await fileRef.exists();
    
    if (!exists) {
      console.error('Upload not found at path:', path);
      return NextResponse.json({ error: "upload not found" }, { status: 404 });
    }

    console.log('File exists, creating database record');

    // Write a Firestore doc linking the recording to a user/session
    await db.collection("voice_uploads").doc(uploadId).set({
      createdAt: Date.now(),
      path,
      contentType: "audio/webm",
      bytes: (await fileRef.getMetadata())[0]?.size ?? null,
    }, { merge: true });

    // Optional: signed URL so you can play it back
    const [url] = await fileRef.getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    
    console.log('Voice commit successful:', { uploadId, path });
    
    return NextResponse.json({ ok: true, url, uploadId });
  } catch (error: any) {
    console.error('Commit error:', error);
    return NextResponse.json(
      { error: "Commit failed", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

