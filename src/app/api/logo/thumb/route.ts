import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

// Placeholder - will be replaced with your actual logo
const THUMB_LOGO = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export async function GET() {
  try {
    // Try to get the latest thumb logo from Firebase Storage
    const [files] = await bucket.getFiles({
      prefix: 'logos/thumb_',
      maxResults: 1
    });

    if (files.length > 0) {
      const logoFile = files[0];
      const [logoBuffer] = await logoFile.download();
      
      return new NextResponse(logoBuffer as any, {
        headers: {
          'Content-Type': logoFile.metadata.contentType || 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Fallback to geometric logo if no logo found in storage
    const buffer = Buffer.from(THUMB_LOGO, 'base64');
    
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Logo thumb error:', error);
    return new NextResponse('Error loading logo', { status: 500 });
  }
}
