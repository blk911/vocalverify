import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("Logo upload API called");
    const formData = await req.formData();
    const file = formData.get('logo') as File;
    const logoType = formData.get('type') as string; // 'thumb' or 'insert'

    console.log("File received:", file?.name, "Type:", logoType);

    if (!file || !logoType) {
      console.log("Missing file or logo type");
      return NextResponse.json(
        { ok: false, error: "Missing file or logo type" },
        { status: 400 }
      );
    }

    if (!['thumb', 'insert'].includes(logoType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid logo type. Must be 'thumb' or 'insert'" },
        { status: 400 }
      );
    }

    // Create file path
    const fileName = `logos/${logoType}_${Date.now()}.${file.name.split('.').pop()}`;
    const fileBuffer = await file.arrayBuffer();

    console.log("Uploading to Firebase Storage:", fileName);
    console.log("Bucket name:", bucket.name);

    // Upload to Firebase Storage
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(Buffer.from(fileBuffer), {
      metadata: {
        contentType: file.type,
        metadata: {
          logoType: logoType,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    console.log("File saved to Firebase Storage");

    // Get public URL (bucket should already be public with uniform access)
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    console.log("Public URL:", publicUrl);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileName: fileName,
      logoType: logoType,
      message: "Logo uploaded successfully"
    });

  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
