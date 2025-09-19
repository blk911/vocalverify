import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('voice') as File;
    const memberCode = formData.get('memberCode') as string;

    if (!file || !memberCode) {
      return NextResponse.json(
        { ok: false, error: "Missing file or member code" },
        { status: 400 }
      );
    }

    // Validate member code format
    const digits = memberCode.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Invalid member code" },
        { status: 400 }
      );
    }

    // Create file path
    const fileName = `voices/${memberCode}/${Date.now()}_voice.webm`;
    const fileBuffer = await file.arrayBuffer();

    // Upload to Firebase Storage
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type || 'audio/webm',
        metadata: {
          memberCode: memberCode,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible
    await fileUpload.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileName: fileName,
      memberCode: memberCode,
      message: "Voice recording uploaded successfully"
    });

  } catch (error) {
    console.error("Voice upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}



