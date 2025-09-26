import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log('🎤 Voice print registration request received');
    
    const { audioBuffer, memberCode, fullName } = await req.json();
    
    if (!audioBuffer || !memberCode || !fullName) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields: audioBuffer, memberCode, fullName"
      }, { status: 400 });
    }
    
    console.log(`🔍 Registering voice print for member: ${memberCode}`);
    
    // Mock voice print registration for testing
    const mockVoicePrint = {
      memberCode,
      fullName,
      transcript: "My name is Spencer Wendt",
      biometrics: {
        pitch: 150,
        tone: 25,
        cadence: 1.2,
        volume: 70,
        duration: 5.0,
        wordCount: 4,
        averageWordLength: 4.5
      },
      confidence: 0.95,
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Voice print registration complete:', mockVoicePrint);
    
    return NextResponse.json({
      ok: true,
      voicePrint: mockVoicePrint,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Voice print registration error:', error);
    return NextResponse.json({
      ok: false,
      error: "Voice print registration failed",
      details: error.message
    }, { status: 500 });
  }
}
