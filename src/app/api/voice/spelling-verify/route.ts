import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log('🔤 Spelling verification request received');
    
    const { audioBuffer, memberCode, expectedSpelling } = await req.json();
    
    if (!audioBuffer || !memberCode || !expectedSpelling) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: audioBuffer, memberCode, expectedSpelling"
      }, { status: 400 });
    }
    
    console.log(`🔍 Verifying spelling for member: ${memberCode}`);
    
    // Mock spelling verification for testing
    const mockSpellingVerification = {
      memberCode,
      expectedSpelling: expectedSpelling.toUpperCase(),
      spokenSpelling: "W-E-N-D-T", // Mock transcribed spelling
      spellingMatch: expectedSpelling.toUpperCase() === "WENDT",
      confidence: 0.92,
      details: "Spelling verification: W-E-N-D-T matches WENDT ✅"
    };
    
    console.log('✅ Spelling verification complete:', mockSpellingVerification);
    
    return NextResponse.json({
      ok: true,
      spellingVerification: mockSpellingVerification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Spelling verification error:', error);
    return NextResponse.json({
      ok: false,
      error: "Spelling verification failed",
      details: error.message
    }, { status: 500 });
  }
}

