import { NextResponse } from "next/server";
import { getDb, getStorage } from "@/lib/firebaseAdmin";
import { asyncHandler, handleApiError, validateRequired } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = asyncHandler(async (req: Request) => {
  logger.info('API Request: POST /api/voice/upload', 'API');
  
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  
  if (!uploadId) {
    throw new Error("Missing uploadId parameter");
  }

  const form = await req.formData();
  const file = form.get("audio") as File | null;
  const phoneDigits = form.get("phoneDigits") as string | null;
  const memberCode = form.get("memberCode") as string | null;
  
  if (!file) {
    throw new Error("Missing audio file");
  }

  // Validate file type
  const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File too large: ${file.size} bytes. Maximum: ${maxSize} bytes`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const phoneSuffix = phoneDigits ? `_${phoneDigits.replace(/\D/g, '')}` : '';
  const timestamp = Date.now();
  const path = `voice/${uploadId}${phoneSuffix}_${timestamp}.webm`;
  
  logger.info(`Uploading voice file: ${path}`, 'VoiceUpload', {
    uploadId,
    memberCode,
    fileSize: file.size,
    fileType: file.type
  });
  
  // Upload to Firebase Storage
  const storage = getStorage();
  const bucket = storage.bucket();
  const gcsFile = bucket.file(path);
  
  await gcsFile.save(buf, { 
    resumable: false, 
    contentType: file.type || "audio/webm",
    metadata: {
      uploadId,
      memberCode,
      phoneDigits,
      uploadedAt: new Date().toISOString()
    }
  });
  
  // Log upload to database
  const db = getDb();
  await db.collection('voice_uploads').add({
    uploadId,
    memberCode,
    path,
    fileSize: file.size,
    fileType: file.type,
    phoneDigits,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded'
  });
  
  logger.info('API Response: POST /api/voice/upload - 200', 'API');
  
  return NextResponse.json({ 
    ok: true, 
    path,
    uploadId,
    fileSize: file.size,
    message: "Voice file uploaded successfully"
  });
});
