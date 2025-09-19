import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    const fileType = searchParams.get('type'); // 'picture' or 'voice'

    if (!memberCode || !fileType) {
      return NextResponse.json(
        { ok: false, error: "Missing member code or file type" },
        { status: 400 }
      );
    }

    if (!['picture', 'voice'].includes(fileType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid file type. Must be 'picture' or 'voice'" },
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

    // Get the latest file for this member and type
    const [files] = await bucket.getFiles({
      prefix: `${fileType}s/${memberCode}/`,
      orderBy: 'timeCreated',
      desc: true,
      maxResults: 1
    });

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files found" },
        { status: 404 }
      );
    }

    const file = files[0];
    const [fileBuffer] = await file.download();

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.metadata.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error("File retrieval error:", error);
    return NextResponse.json(
      { ok: false, error: "File retrieval failed" },
      { status: 500 }
    );
  }
}



