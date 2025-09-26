import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Firebase Storage access...');
    
    const bucket = storage.bucket();
    console.log('Bucket name:', bucket.name);
    
    // Try to list files in the bucket
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log('Files found:', files.length);
    
    return NextResponse.json({
      ok: true,
      bucketName: bucket.name,
      filesCount: files.length,
      message: "Storage bucket is accessible"
    });
    
  } catch (error: any) {
    console.error('Storage test error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
}

