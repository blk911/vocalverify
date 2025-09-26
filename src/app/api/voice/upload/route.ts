import { NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  if (!uploadId) return NextResponse.json({ error: "missing uploadId" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("audio") as File | null; // field name MUST be "audio"
  const phoneDigits = form.get("phoneDigits") as string | null; // Phone digits for secure linking
  if (!file) return NextResponse.json({ error: "missing audio" }, { status: 400 });

  console.log('Voice upload API called with uploadId:', uploadId);
  console.log('File details:', { name: file.name, size: file.size, type: file.type });

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    // Include phone digits in filename for secure linking
    const phoneSuffix = phoneDigits ? `_${phoneDigits.replace(/\D/g, '')}` : '';
    const path = `voice/${uploadId}${phoneSuffix}.webm`;
    
    console.log('Uploading voice file to Firebase Storage:', path);
    console.log('File size:', buf.length, 'bytes');
    
    // Upload to Firebase Storage
    const gcsFile = storage.bucket().file(path);
    await gcsFile.save(buf, { 
      resumable: false, 
      contentType: file.type || "audio/webm" 
    });
    
    console.log('Voice file uploaded successfully to Firebase Storage');
    
    return NextResponse.json({ 
      ok: true, 
      path,
      message: "Voice file uploaded successfully to Firebase Storage"
    });
  } catch (error: any) {
    console.error('Voice upload error:', error);
    return NextResponse.json({ 
      error: "Failed to upload voice file", 
      details: error.message 
    }, { status: 500 });
  }
}
