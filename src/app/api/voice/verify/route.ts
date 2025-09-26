import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log('🎤 Voice verification request received');
    
    const { audioBuffer, memberCode, expectedContent } = await req.json();
    
    if (!audioBuffer || !memberCode) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: audioBuffer, memberCode"
      }, { status: 400 });
    }
    
    console.log(`🔍 Verifying voice for member: ${memberCode}`);
    
    // Mock voice verification for testing
    const mockVerification = {
      contentMatch: true,
      biometricMatch: true,
      overallMatch: true,
      confidence: 0.95,
      details: "Content: ✅, Voice: Pitch: ✅, Tone: ✅, Cadence: ✅"
    };
    
    console.log('✅ Voice verification complete:', mockVerification);
    
    return NextResponse.json({
      ok: true,
      verification: mockVerification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Voice verification error:', error);
    return NextResponse.json({
      ok: false,
      error: "Voice verification failed",
      details: error.message
    }, { status: 500 });
  }
}