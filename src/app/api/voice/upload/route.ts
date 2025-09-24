import { NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// optional for large files: export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log('Voice upload API called');
    
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");
    if (!uploadId) {
      console.error('Missing uploadId in query params');
      return NextResponse.json({ error: "missing uploadId" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("audio") as File | null; // MUST match client key
    if (!file) {
      console.error('Missing audio file in form data');
      return NextResponse.json({ error: "missing audio" }, { status: 400 });
    }

    console.log('Uploading file:', {
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const bucket = storage.bucket(); // ensure env has FIREBASE_STORAGE_BUCKET
    const path = `voice/${uploadId}.webm`;
    const gcsFile = bucket.file(path);

    await gcsFile.save(buffer, {
      resumable: false,
      contentType: file.type || "audio/webm",
      metadata: { cacheControl: "private, max-age=0" },
    });

    console.log('File uploaded successfully:', { uploadId, path });

    // Return the canonical storage path so commit can verify it
    return NextResponse.json({ path });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Upload failed", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
