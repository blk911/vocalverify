import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    
    // Check content type and handle accordingly
    const contentType = req.headers.get('content-type') || '';
    
    let file: File;
    let memberCode: string;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await req.formData();
      file = formData.get('file') as File;
      memberCode = formData.get('memberCode') as string;
    } else {
      // Handle JSON with base64 file data
      const body = await req.json();
      const { fileData, fileName, fileType, memberCode: mc } = body;
      
      if (!fileData || !fileName || !mc) {
        return NextResponse.json(
          { ok: false, error: "Missing required fields", code: "MISSING_FIELDS" },
          { status: 400 }
        );
      }
      
      // Convert base64 to File object
      const buffer = Buffer.from(fileData, 'base64');
      file = new File([buffer], fileName, { type: fileType || 'image/jpeg' });
      memberCode = mc;
    }
    
    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "No memberCode provided", code: "NO_MEMBER_CODE" },
        { status: 400 }
      );
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profile-pictures/${memberCode}-${new Date().toISOString().replace(/[:.]/g, '-')}-${file.name}`;
    
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
    
    // Update user profile with picture URL
    await db.collection('users').doc(memberCode).update({
      profilePicture: url,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      ok: true,
      message: "Profile picture uploaded successfully",
      url: url,
      fileName: fileName
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to upload profile picture", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}