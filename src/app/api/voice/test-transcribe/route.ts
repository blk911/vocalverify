import { NextResponse } from "next/server";
import { awsTranscribeVoiceAuth } from "@/lib/awsTranscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { audioBuffer, phoneNumber } = await req.json();
    
    if (!audioBuffer) {
      return NextResponse.json({ error: "missing audioBuffer" }, { status: 400 });
    }

    console.log('Testing AWS Transcribe integration...');

    // Convert base64 audio buffer to Buffer
    const audioBufferData = Buffer.from(audioBuffer, 'base64');
    const fileName = `test-voice-${Date.now()}.webm`;
    const expectedPhone = phoneNumber || "5551234567";

    // Test voice verification
    const verificationResult = await awsTranscribeVoiceAuth.verifyVoice(
      audioBufferData,
      fileName,
      expectedPhone
    );

    console.log('AWS Transcribe test completed:', verificationResult);

    return NextResponse.json({
      ok: true,
      testResult: verificationResult,
      message: "AWS Transcribe integration test completed"
    });

  } catch (error: any) {
    console.error('AWS Transcribe test error:', error);
    return NextResponse.json({
      error: "Failed to test AWS Transcribe",
      details: error.message
    }, { status: 500 });
  }
}
