import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('Profile picture upload API called');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const memberCode = formData.get('memberCode') as string;
    
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
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to upload profile picture", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}