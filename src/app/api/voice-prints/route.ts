import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');
    
    if (!memberCode) {
      return NextResponse.json(
        { ok: false, error: "Member code required" },
        { status: 400 }
      );
    }
    
    // For now, return empty voice prints data
    // This will be expanded when voice prints are implemented
    const voicePrints = {
      person1: { name: "", status: "pending", voiceFile: null },
      person2: { name: "", status: "pending", voiceFile: null },
      person3: { name: "", status: "pending", voiceFile: null }
    };
    
    return NextResponse.json({
      ok: true,
      voicePrints,
      completionStatus: "incomplete",
      progress: "0/3"
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load voice prints" },
      { status: 500 }
    );
  }
}
