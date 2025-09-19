import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('picture') as File;
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
    const fileName = `pictures/${memberCode}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    // Upload to Firebase Storage
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
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
      message: "Picture uploaded successfully"
    });

  } catch (error) {
    console.error("Picture upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}


