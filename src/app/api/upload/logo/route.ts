import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('Logo upload API called');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `logos/${new Date().toISOString().replace(/[:.]/g, '-')}-${file.name}`;
    
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year
    });
    
    return NextResponse.json({
      ok: true,
      message: "Logo uploaded successfully",
      url: url,
      fileName: fileName
    });
    
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to upload logo", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
