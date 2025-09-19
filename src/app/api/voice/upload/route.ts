// src/app/api/voice/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";

export const runtime = "nodejs";

const storage = new Storage({
  keyFilename: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
});
const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET!);

// simple in-mem rate limit (userId → uploads in last minute)
const uploadCounts = new Map<string, { count: number; ts: number }>();

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const userId = form.get("userId")?.toString();
    const file = form.get("file") as File | null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId", code: "NO_USERID" },
        { status: 400 }
      );
    }
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file", code: "NO_FILE" },
        { status: 400 }
      );
    }

    // ---- rate limiting ----
    const now = Date.now();
    const rec = uploadCounts.get(userId);
    if (rec && now - rec.ts < 60_000 && rec.count >= 3) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }
    if (!rec || now - rec.ts > 60_000) {
      uploadCounts.set(userId, { count: 1, ts: now });
    } else {
      rec.count++;
      uploadCounts.set(userId, rec);
    }

    // ---- validation ----
    if (file.type !== "audio/webm") {
      return NextResponse.json(
        { ok: false, error: "Invalid mime type", code: "INVALID_MIME" },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "File too large", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // ---- upload to GCS ----
    const uploadId = uuidv4();
    const destPath = `voices/tmp/${uploadId}.webm`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await bucket.file(destPath).save(buffer, {
      contentType: file.type,
      resumable: false,
    });

    console.log("Uploaded voice file", { userId, uploadId, size: file.size });

    return NextResponse.json({
      ok: true,
      uploadId,
      path: destPath,
    });
  } catch (err: any) {
    console.error("Upload error", err);
    return NextResponse.json(
      { ok: false, error: "Upload failed", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
