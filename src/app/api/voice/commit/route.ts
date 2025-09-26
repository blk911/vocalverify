import { NextResponse } from "next/server";
import { db, storage } from "@/lib/firebaseAdmin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { uploadId } = await req.json().catch(() => ({}));
  if (!uploadId) return NextResponse.json({ error: "missing uploadId" }, { status: 400 });

  console.log('Voice commit API called with uploadId:', uploadId);

  try {
    // Get phone digits from request for path matching
    const { phoneDigits } = await req.json().catch(() => ({}));
    const phoneSuffix = phoneDigits ? `_${phoneDigits.replace(/\D/g, '')}` : '';
    const path = `voice/${uploadId}${phoneSuffix}.webm`; // MUST match upload route
    const fileRef = storage.bucket().file(path);
    
    // Check if file exists in Firebase Storage
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ 
        error: "Upload not found", 
        path 
      }, { status: 404 });
    }

    // Get file metadata
    const [meta] = await fileRef.getMetadata().catch(() => [{ size: 0 } as any]);
    
    // Create database record for voice upload
    await db.collection("voice_uploads").doc(uploadId).set(
      {
        createdAt: new Date().toISOString(),
        path,
        contentType: meta?.contentType || "audio/webm",
        bytes: Number(meta?.size || 0),
        status: "completed"
      },
      { merge: true }
    );

    // Generate signed URL for accessing the file
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    console.log('Voice upload committed to database successfully');

    return NextResponse.json({ 
      ok: true, 
      uploadId, 
      url,
      path,
      message: "Voice recording committed successfully to Firebase Storage"
    });
  } catch (error: any) {
    console.error('Voice commit error:', error);
    return NextResponse.json({ 
      error: "Failed to commit voice recording", 
      details: error.message 
    }, { status: 500 });
  }
}
