import { NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

// Base64 encoded 1x1 transparent PNG as placeholder
const PLACEHOLDER_LOGO = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export async function GET() {
  try {
    // Try to get the latest insert logo from Firebase Storage
    const [files] = await bucket.getFiles({
      prefix: 'logos/insert_',
      orderBy: 'timeCreated',
      desc: true,
      maxResults: 1
    });

    if (files.length > 0) {
      const logoFile = files[0];
      const [logoBuffer] = await logoFile.download();
      
      return new NextResponse(logoBuffer, {
        headers: {
          'Content-Type': logoFile.metadata.contentType || 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Fallback to placeholder if no logo found
    const buffer = Buffer.from(PLACEHOLDER_LOGO, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Logo insert error:', error);
    return new NextResponse('Error loading logo', { status: 500 });
  }
}
