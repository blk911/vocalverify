import { NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");
    if (!uploadId) return NextResponse.json({ error: "missing uploadId" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("audio") as File | null; // field name MUST be "audio"
    const phoneDigits = form.get("phoneDigits") as string | null; // Phone digits for secure linking
    if (!file) return NextResponse.json({ error: "missing audio" }, { status: 400 });


    const buf = Buffer.from(await file.arrayBuffer());
    // Include phone digits in filename for secure linking
    const phoneSuffix = phoneDigits ? `_${phoneDigits.replace(/\D/g, '')}` : '';
    const path = `voice/${uploadId}${phoneSuffix}.webm`;
    
    
    // Upload to Firebase Storage
    const gcsFile = storage.bucket().file(path);
    await gcsFile.save(buf, { 
      resumable: false, 
      contentType: file.type || "audio/webm" 
    });
    
    
    return NextResponse.json({ 
      ok: true, 
      path,
      message: "Voice file uploaded successfully to Firebase Storage"
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to upload voice file", 
      details: error.message 
    }, { status: 500 });
  }
}
